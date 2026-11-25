package com.mindswipe.web;

import com.mindswipe.dto.FeedPage;
import com.mindswipe.dto.PostView;
import com.mindswipe.dto.TopicCount;
import com.mindswipe.repo.PostRepository;
import com.mindswipe.support.CurrentContext;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

/** Read endpoints: the feed, a single card, and topic counts. */
@RestController
@RequestMapping("/api")
public class ContentController {

    private final PostRepository posts;
    private final CurrentContext ctx;

    public ContentController(PostRepository posts, CurrentContext ctx) {
        this.posts = posts;
        this.ctx = ctx;
    }

    @GetMapping("/feed")
    public FeedPage feed(@RequestParam(required = false) Long cursor,
                         @RequestParam(defaultValue = "10") int limit,
                         @RequestParam(required = false) String topic,
                         @RequestParam(required = false) Integer difficulty,
                         HttpServletRequest request) {
        long tenant = ctx.tenantId(request);
        long cur = cursor == null ? 0L : cursor;
        return posts.feed(tenant, cur, limit, topic, difficulty);
    }

    @GetMapping("/posts/{id}")
    public PostView post(@PathVariable long id, HttpServletRequest request) {
        long tenant = ctx.tenantId(request);
        return posts.findById(tenant, id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "post not found"));
    }

    @GetMapping("/topics")
    public TopicsResponse topics(HttpServletRequest request) {
        long tenant = ctx.tenantId(request);
        return new TopicsResponse(posts.topics(tenant));
    }

    /** Wrapper to keep the old { items: [...] } response shape. */
    public record TopicsResponse(List<TopicCount> items) {}
}
