package com.mindswipe.dto;

/** A topic and how many cards it has — powers the topic filter. */
public record TopicCount(String topic, long count) {}
