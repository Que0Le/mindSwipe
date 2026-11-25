package com.mindswipe.repo;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mindswipe.dto.FeedPage;
import com.mindswipe.dto.PostView;
import com.mindswipe.dto.TopicCount;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** Read side: the feed, a single card, and topic counts. Explicit SQL on purpose. */
@Repository
public class PostRepository {

    private static final int MAX_LIMIT = 50;

    private final JdbcTemplate jdbc;
    private final ObjectMapper mapper;

    public PostRepository(JdbcTemplate jdbc, ObjectMapper mapper) {
        this.jdbc = jdbc;
        this.mapper = mapper;
    }

    private static final String SELECT_COLS =
            "id, subject, topic, difficulty, question_type, prompt, " +
            "choices, answer, detail, content_version, created_at";

    private final RowMapper<PostView> postRowMapper = (ResultSet rs, int n) -> new PostView(
            rs.getLong("id"),
            rs.getString("subject"),
            rs.getString("topic"),
            (Integer) rs.getObject("difficulty"),
            rs.getString("question_type"),
            rs.getString("prompt"),
            json(rs.getString("choices")),
            json(rs.getString("answer")),
            json(rs.getString("detail")),
            rs.getInt("content_version"),
            rs.getTimestamp("created_at").toInstant()
    );

    /** Keyset pagination over id. Returns limit+1 internally to compute hasMore. */
    public FeedPage feed(long tenantId, long cursor, int limit, String topic, Integer difficulty) {
        int lim = Math.min(Math.max(limit, 1), MAX_LIMIT);

        StringBuilder sql = new StringBuilder("select ").append(SELECT_COLS)
                .append(" from post where tenant_id = ? and status = 'approved' and id > ?");
        List<Object> params = new ArrayList<>();
        params.add(tenantId);
        params.add(cursor);
        if (topic != null && !topic.isBlank()) {
            sql.append(" and topic = ?");
            params.add(topic);
        }
        if (difficulty != null) {
            sql.append(" and difficulty = ?");
            params.add(difficulty);
        }
        sql.append(" order by id asc limit ?");
        params.add(lim + 1);

        List<PostView> rows = jdbc.query(sql.toString(), postRowMapper, params.toArray());

        boolean hasMore = rows.size() > lim;
        List<PostView> page = hasMore ? rows.subList(0, lim) : rows;
        Long nextCursor = page.isEmpty() ? null : page.get(page.size() - 1).id();
        return new FeedPage(List.copyOf(page), nextCursor, hasMore);
    }

    public Optional<PostView> findById(long tenantId, long id) {
        List<PostView> rows = jdbc.query(
                "select " + SELECT_COLS + " from post where tenant_id = ? and id = ?",
                postRowMapper, tenantId, id);
        return rows.stream().findFirst();
    }

    public List<TopicCount> topics(long tenantId) {
        return jdbc.query(
                "select topic, count(*) as cnt from post where tenant_id = ? group by topic order by cnt desc",
                (rs, n) -> new TopicCount(rs.getString("topic"), rs.getLong("cnt")),
                tenantId);
    }

    /** The current content_version of a card, so an attempt can pin what it saw. */
    public Integer contentVersion(long tenantId, long postId) {
        List<Integer> v = jdbc.query(
                "select content_version from post where tenant_id = ? and id = ?",
                (rs, n) -> rs.getInt("content_version"), tenantId, postId);
        return v.isEmpty() ? null : v.get(0);
    }

    private JsonNode json(String raw) {
        if (raw == null) {
            return null;
        }
        try {
            return mapper.readTree(raw);
        } catch (Exception e) {
            throw new IllegalStateException("Corrupt JSON in post column: " + e.getMessage(), e);
        }
    }
}
