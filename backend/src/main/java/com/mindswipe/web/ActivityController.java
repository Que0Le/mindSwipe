package com.mindswipe.web;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mindswipe.dto.UserState;
import com.mindswipe.repo.ActivityRepository;
import com.mindswipe.repo.ActivityRepository.AttemptResult;
import com.mindswipe.support.CurrentContext;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Set;

/** Write endpoints: capture every user input, plus per-user state read-back. */
@RestController
@RequestMapping("/api")
public class ActivityController {

    private static final Set<String> REACTION_KINDS = Set.of("like", "dislike");

    private final ActivityRepository activity;
    private final CurrentContext ctx;
    private final ObjectMapper mapper;
    private final com.mindswipe.repo.PostRepository posts;

    public ActivityController(ActivityRepository activity, CurrentContext ctx,
                              ObjectMapper mapper, com.mindswipe.repo.PostRepository posts) {
        this.activity = activity;
        this.ctx = ctx;
        this.mapper = mapper;
        this.posts = posts;
    }

    @PostMapping("/attempts")
    public AttemptResponse attempt(@RequestBody @Valid AttemptRequest body, HttpServletRequest request) {
        long user = ctx.userId(request);
        long tenant = ctx.tenantId(request);
        String selected = write(body.selected() == null ? List.of() : body.selected());
        String detail = body.detail() == null ? null : write(body.detail());
        Integer contentVersion = posts.contentVersion(tenant, body.postId());
        AttemptResult res = activity.recordAttempt(
                user, body.postId(), tenant, selected, body.durationMs(), detail, contentVersion);
        return new AttemptResponse(res.id(), res.sessionSeq());
    }

    @PostMapping("/reactions")
    public OkResponse reaction(@RequestBody @Valid ReactionRequest body, HttpServletRequest request) {
        if (!REACTION_KINDS.contains(body.kind())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "kind must be like or dislike");
        }
        long user = ctx.userId(request);
        long tenant = ctx.tenantId(request);
        boolean on = body.on() == null || body.on();
        if (on) {
            activity.setReaction(user, body.postId(), tenant, body.kind());
        } else {
            activity.clearReaction(user, body.postId(), body.kind());
        }
        return new OkResponse(true);
    }

    @PostMapping("/views")
    public OkResponse view(@RequestBody @Valid ViewRequest body, HttpServletRequest request) {
        activity.recordView(ctx.userId(request), body.postId(), ctx.tenantId(request));
        return new OkResponse(true);
    }

    @GetMapping("/me/state")
    public UserState myState(HttpServletRequest request) {
        return activity.userState(ctx.userId(request), ctx.tenantId(request));
    }

    private String write(Object value) {
        try {
            return mapper.writeValueAsString(value);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "invalid JSON payload");
        }
    }

    // --- request / response shapes ---------------------------------------
    public record AttemptRequest(
            @NotNull Long postId,
            List<String> selected,   // chosen choice ids, e.g. ["c2"]
            Integer durationMs,
            JsonNode detail          // optional within-session telemetry
    ) {}

    public record ReactionRequest(
            @NotNull Long postId,
            @NotNull String kind,    // like | dislike
            Boolean on               // true = set (default), false = clear
    ) {}

    public record ViewRequest(@NotNull Long postId) {}

    public record AttemptResponse(long id, int sessionSeq) {}

    public record OkResponse(boolean ok) {}
}
