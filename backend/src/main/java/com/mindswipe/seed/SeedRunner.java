package com.mindswipe.seed;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.io.ResourceLoader;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

/**
 * One-shot content seed. If {@code post} is empty, loads the authored question
 * bank (questions_gymnasium.json) and inserts each as an MCQ card.
 *
 * Conversion note: the source stores choices as a letter map {@code {"A": ...}}
 * with a letter answer key. We map those to STABLE choice ids ({@code c1, c2…})
 * so the stored answer never depends on display position — the revision-safety
 * rule from docs/TECH.md.
 */
@Component
public class SeedRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(SeedRunner.class);

    private final JdbcTemplate jdbc;
    private final ObjectMapper mapper;
    private final ResourceLoader resources;
    private final boolean enabled;
    private final String location;

    public SeedRunner(JdbcTemplate jdbc, ObjectMapper mapper, ResourceLoader resources,
                      @Value("${mindswipe.seed.enabled:true}") boolean enabled,
                      @Value("${mindswipe.seed.location:classpath:seed/questions_gymnasium.json}") String location) {
        this.jdbc = jdbc;
        this.mapper = mapper;
        this.resources = resources;
        this.enabled = enabled;
        this.location = location;
    }

    @Override
    public void run(ApplicationArguments args) throws Exception {
        if (!enabled) {
            log.info("Seed disabled (mindswipe.seed.enabled=false).");
            return;
        }
        Integer existing = jdbc.queryForObject("select count(*) from post", Integer.class);
        if (existing != null && existing > 0) {
            log.info("Seed skipped: post already has {} rows.", existing);
            return;
        }

        JsonNode root;
        try (InputStream in = resources.getResource(location).getInputStream()) {
            root = mapper.readTree(in);
        }
        // The bank is { meta, questions: [...] }; accept a bare array too.
        JsonNode questions = (root != null && root.has("questions")) ? root.get("questions") : root;
        if (questions == null || !questions.isArray()) {
            log.warn("Seed source {} has no 'questions' array; nothing inserted.", location);
            return;
        }

        String sql = "insert into post " +
                "(tenant_id, subject, topic, difficulty, question_type, prompt, choices, answer, detail, " +
                " content_version, visibility, status) " +
                "values (1, ?, ?, ?, 'mcq', ?, ?::jsonb, ?::jsonb, ?::jsonb, 1, 'public', 'approved')";

        List<Object[]> batch = new ArrayList<>();
        for (JsonNode q : questions) {
            batch.add(toRow(q));
        }
        jdbc.batchUpdate(sql, batch);
        log.info("Seeded {} cards from {}.", batch.size(), location);
    }

    private Object[] toRow(JsonNode q) throws Exception {
        String subject = text(q, "subject");
        String topic = text(q, "topic");
        Integer difficulty = mapDifficulty(text(q, "difficulty"));
        String prompt = text(q, "question");

        // Build stable-id choices from the letter map, in sorted letter order.
        JsonNode options = q.get("options");
        Map<String, String> sorted = new TreeMap<>();
        if (options != null && options.isObject()) {
            Iterator<Map.Entry<String, JsonNode>> it = options.fields();
            while (it.hasNext()) {
                Map.Entry<String, JsonNode> e = it.next();
                sorted.put(e.getKey(), e.getValue().asText());
            }
        }
        List<ObjectNode> choices = new ArrayList<>();
        Map<String, String> letterToId = new java.util.HashMap<>();
        int i = 1;
        for (Map.Entry<String, String> e : sorted.entrySet()) {
            String id = "c" + i++;
            letterToId.put(e.getKey(), id);
            ObjectNode c = mapper.createObjectNode();
            c.put("id", id);
            c.put("text", e.getValue());
            choices.add(c);
        }

        String correctLetter = text(q, "correct");
        String correctId = letterToId.getOrDefault(correctLetter, correctLetter);

        ObjectNode answer = mapper.createObjectNode();
        answer.set("correct", mapper.createArrayNode().add(correctId));
        answer.put("explanation", text(q, "explanation"));

        ObjectNode detail = mapper.createObjectNode();
        detail.put("more_info", text(q, "more_info"));
        detail.put("reference", text(q, "reference"));
        detail.put("example", text(q, "example"));
        detail.put("open_question", text(q, "open_question"));

        return new Object[]{
                subject,
                topic,
                difficulty,
                prompt,
                mapper.writeValueAsString(choices),
                mapper.writeValueAsString(answer),
                mapper.writeValueAsString(detail)
        };
    }

    private Integer mapDifficulty(String raw) {
        if (raw == null) {
            return null;
        }
        return switch (raw.trim().toLowerCase()) {
            case "leicht" -> 1;
            case "mittel" -> 2;
            case "schwer" -> 3;
            default -> null;
        };
    }

    private String text(JsonNode node, String field) {
        JsonNode v = node.get(field);
        return (v == null || v.isNull()) ? null : v.asText();
    }
}
