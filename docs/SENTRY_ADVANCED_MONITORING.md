# 🎯 Sentry Advanced Monitoring Strategy for The Best Chatbot

> **Enterprise-Grade Observability Blueprint**  
> Transform Sentry from error tracking to complete observability platform  
> 20+ Advanced Custom Events | Predictive Monitoring | Cost Attribution | Business Intelligence

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Performance Observability Layer](#1-performance-observability-layer)
3. [Business Intelligence Layer](#2-business-intelligence-layer)
4. [Predictive & Proactive Layer](#3-predictive--proactive-layer)
5. [Implementation Roadmap](#4-implementation-roadmap)
6. [Advanced Event Catalog](#5-advanced-event-catalog)

---

## Executive Summary

### Current State
- ✅ 10 Basic Events Implemented (authentication, chat operations, tool invocation, workflows, MCP, storage)
- ✅ Multi-layer PII scrubbing, 10% production sampling
- ✅ TypeScript compilation passing, security scan clean

### Next-Level Strategy
This document details **23 advanced custom events** that transform Sentry into a comprehensive observability platform covering:

- **Performance**: Database queries, streaming latency, resource health
- **Business**: Cost attribution, user funnels, quality metrics
- **Predictive**: Trend analysis, failure correlation, capacity planning

### Key Opportunities Identified
1. **N+1 Query Pattern** in `selectThreadDetails` (performance bottleneck)
2. **8 LLM Providers** without unified cost tracking (business blind spot)
3. **Streaming Performance** unmeasured (TTFT, chunk delivery)
4. **MCP Lifecycle** gaps (server crashes, connection leaks)
5. **Workflow Execution** state management monitoring needed

---

## 1. Performance Observability Layer

### 1.1 Database Performance Monitoring

#### Event #1: Database Query Execution
**Purpose**: Track all database queries with detailed performance metrics

\`\`\`typescript
import * as Sentry from "@sentry/nextjs";
import { eq } from "drizzle-orm";

// Instrument Drizzle queries
export async function instrumentedQuery<T>(
  queryFn: () => Promise<T>,
  metadata: {
    operation: "SELECT" | "INSERT" | "UPDATE" | "DELETE";
    table: string;
    context?: string;
  }
): Promise<T> {
  return await Sentry.startSpan(
    {
      name: \`db.\${metadata.operation.toLowerCase()}_\${metadata.table}\`,
      op: "db.query",
      attributes: {
        "db.operation": metadata.operation,
        "db.table": metadata.table,
        "db.system": "postgresql",
        "db.orm": "drizzle",
        ...(metadata.context && { "db.context": metadata.context }),
      },
    },
    async (span) => {
      const startTime = Date.now();
      try {
        const result = await queryFn();
        
        const duration = Date.now() - startTime;
        span.setAttribute("db.duration_ms", duration);
        
        // Detect slow queries
        if (duration > 500) {
          span.setAttribute("db.slow_query", true);
          Sentry.addBreadcrumb({
            category: "db.performance",
            message: \`Slow query detected: \${metadata.table} (\${duration}ms)\`,
            level: "warning",
            data: metadata,
          });
        }
        
        return result;
      } catch (error) {
        span.setStatus({ code: 2, message: "Query failed" });
        throw error;
      }
    }
  );
}

// Usage example in repository
export const pgChatRepository = {
  selectThreadDetails: async (id: string) => {
    return instrumentedQuery(
      async () => {
        // Original query logic
        const thread = await db.select()...;
        return thread;
      },
      { operation: "SELECT", table: "chat_thread", context: "thread_details" }
    );
  }
};
\`\`\`

**Key Metrics**: `db.duration_ms`, `db.operation`, `db.table`, `db.slow_query`  
**Sampling**: 100% for >500ms, 20% for fast queries  
**Alert**: >1000ms queries OR >10 slow queries/min

#### Event #2: N+1 Query Detection
**Purpose**: Identify and alert on N+1 query patterns

\`\`\`typescript
// Detect sequential queries in same transaction
export function detectN1Pattern(transactionId: string) {
  const queryCount = new Map<string, number>();
  
  Sentry.getCurrentScope().addEventProcessor((event) => {
    if (event.type === "transaction") {
      const spans = event.spans || [];
      
      // Group queries by table/operation
      spans.filter(s => s.op === "db.query").forEach(span => {
        const key = \`\${span.data?.["db.operation"]}_\${span.data?.["db.table"]}\`;
        queryCount.set(key, (queryCount.get(key) || 0) + 1);
      });
      
      // Detect N+1 pattern (>5 similar queries in single transaction)
      queryCount.forEach((count, operation) => {
        if (count > 5) {
          Sentry.captureMessage(
            \`Potential N+1 query pattern detected: \${operation} executed \${count} times\`,
            {
              level: "warning",
              tags: {
                n1_pattern: operation,
                query_count: count.toString(),
              },
              contexts: {
                n1_detection: {
                  operation,
                  count,
                  transaction: transactionId,
                },
              },
            }
          );
        }
      });
    }
    return event;
  });
}
\`\`\`

**Key Metrics**: `query_count`, `n1_pattern`, `transaction_context`  
**Sampling**: 100% (critical for performance)  
**Alert**: Any detection triggers warning

#### Event #3: Connection Pool Metrics
**Purpose**: Monitor database connection health

\`\`\`typescript
import { Pool } from "pg";

export function instrumentConnectionPool(pool: Pool) {
  // Capture connection metrics every 30s
  setInterval(() => {
    Sentry.startSpan(
      {
        name: "db.connection_pool_metrics",
        op: "db.pool",
      },
      (span) => {
        const totalCount = pool.totalCount;
        const idleCount = pool.idleCount;
        const waitingCount = pool.waitingCount;
        
        span.setAttributes({
          "db.pool.total": totalCount,
          "db.pool.idle": idleCount,
          "db.pool.waiting": waitingCount,
          "db.pool.active": totalCount - idleCount,
          "db.pool.utilization": ((totalCount - idleCount) / totalCount) * 100,
        });
        
        // Alert on pool exhaustion
        if (waitingCount > 0) {
          Sentry.addBreadcrumb({
            category: "db.pool",
            message: \`Connection pool exhaustion: \${waitingCount} waiting\`,
            level: "error",
          });
        }
      }
    );
  }, 30000);
}
\`\`\`

**Key Metrics**: `db.pool.utilization`, `db.pool.waiting`, `db.pool.active`  
**Sampling**: 100% (critical infrastructure metric)  
**Alert**: Utilization >80% OR waiting >3

---

### 1.2 Streaming Performance Monitoring

#### Event #4: Time to First Token (TTFT)
**Purpose**: Measure and optimize streaming response latency

\`\`\`typescript
import { streamText } from "ai";

export async function instrumentedStreamText(params: any) {
  const startTime = Date.now();
  let firstTokenTime: number | null = null;
  let totalTokens = 0;
  
  return Sentry.startSpan(
    {
      name: "ai.stream_response",
      op: "ai.streaming",
      attributes: {
        "ai.model": params.model.modelId,
        "ai.provider": params.model.provider,
      },
    },
    async (span) => {
      const stream = await streamText({
        ...params,
        experimental_telemetry: {
          isEnabled: true,
          functionId: "chat_stream",
          recordInputs: true,
          recordOutputs: true,
        },
      });
      
      // Wrap stream to capture metrics
      const originalStream = stream.textStream;
      stream.textStream = (async function* () {
        for await (const chunk of originalStream) {
          if (firstTokenTime === null) {
            firstTokenTime = Date.now();
            const ttft = firstTokenTime - startTime;
            
            span.setAttribute("ai.ttft_ms", ttft);
            
            // Track TTFT quality tiers
            const quality = ttft < 500 ? "excellent" : 
                           ttft < 1000 ? "good" :
                           ttft < 2000 ? "acceptable" : "poor";
            span.setAttribute("ai.ttft_quality", quality);
            
            Sentry.addBreadcrumb({
              category: "ai.streaming",
              message: \`First token: \${ttft}ms (\${quality})\`,
              level: ttft > 2000 ? "warning" : "info",
            });
          }
          
          totalTokens++;
          yield chunk;
        }
        
        const totalDuration = Date.now() - startTime;
        span.setAttribute("ai.total_duration_ms", totalDuration);
        span.setAttribute("ai.token_count", totalTokens);
      })();
      
      return stream;
    }
  );
}
\`\`\`

**Key Metrics**: `ai.ttft_ms`, `ai.ttft_quality`, `ai.token_count`  
**Sampling**: 50% (high-volume, performance-critical)  
**Alert**: p95 TTFT >2000ms OR >5% poor quality


#### Event #5: Stream Abandonment Tracking
**Purpose**: Understand why users abandon streaming responses

```typescript
export function trackStreamAbandonment(
  streamId: string,
  reason: "timeout" | "client_disconnect" | "error" | "complete"
) {
  Sentry.addBreadcrumb({
    category: "ai.streaming",
    message: `Stream ${streamId} ended: ${reason}`,
    level: reason === "error" ? "error" : "info",
    data: {
      stream_id: streamId,
      abandonment_reason: reason,
    },
  });
  
  if (reason !== "complete") {
    Sentry.captureMessage(`Stream abandoned: ${reason}`, {
      level: "warning",
      tags: {
        abandonment_reason: reason,
        stream_id: streamId,
      },
    });
  }
}
```

**Key Metrics**: `abandonment_reason`, `stream_id`  
**Sampling**: 100% for abandonment, 10% for completion  
**Alert**: >10% abandonment rate (excluding client_disconnect)

---

### 1.3 Resource Health Monitoring

#### Event #6: MCP Server Lifecycle
**Purpose**: Track MCP server spawning, crashes, and resource leaks

```typescript
import { MCPClient } from "./create-mcp-client";

export function instrumentMCPClient(client: MCPClient, serverId: string, serverName: string) {
  // Track server initialization
  Sentry.startSpan(
    {
      name: "mcp.server_init",
      op: "mcp.lifecycle",
      attributes: {
        "mcp.server_id": serverId,
        "mcp.server_name": serverName,
      },
    },
    async (span) => {
      const startTime = Date.now();
      
      try {
        await client.connect();
        
        const duration = Date.now() - startTime;
        span.setAttribute("mcp.init_duration_ms", duration);
        
        Sentry.addBreadcrumb({
          category: "mcp.lifecycle",
          message: `MCP server initialized: ${serverName} (${duration}ms)`,
          level: "info",
        });
      } catch (error) {
        span.setStatus({ code: 2, message: "Initialization failed" });
        
        Sentry.captureException(error, {
          tags: {
            mcp_server_id: serverId,
            mcp_server_name: serverName,
            event_type: "mcp_init_failure",
          },
        });
        
        throw error;
      }
    }
  );
  
  // Monitor for crashes
  client.on("error", (error) => {
    Sentry.captureException(error, {
      tags: {
        mcp_server_id: serverId,
        mcp_server_name: serverName,
        event_type: "mcp_server_crash",
      },
      contexts: {
        mcp: {
          server_id: serverId,
          server_name: serverName,
          uptime_ms: Date.now() - client.startTime,
        },
      },
    });
  });
  
  // Track disconnections
  client.on("disconnect", () => {
    const uptime = Date.now() - client.startTime;
    
    Sentry.addBreadcrumb({
      category: "mcp.lifecycle",
      message: `MCP server disconnected: ${serverName} (uptime: ${uptime}ms)`,
      level: uptime < 1800000 ? "warning" : "info", // <30min = warning
    });
  });
}
```

**Key Metrics**: `mcp.init_duration_ms`, `mcp.uptime_ms`, `mcp.server_name`  
**Sampling**: 100% (critical for MCP reliability)  
**Alert**: >3 crashes/hour OR init_duration >5000ms

#### Event #7: Memory Usage Sampling
**Purpose**: Detect memory leaks and optimize resource usage

```typescript
export function startMemoryMonitoring() {
  setInterval(() => {
    const memUsage = process.memoryUsage();
    
    Sentry.startSpan(
      {
        name: "system.memory_metrics",
        op: "system.health",
      },
      (span) => {
        const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
        const heapTotalMB = memUsage.heapTotal / 1024 / 1024;
        const utilization = (heapUsedMB / heapTotalMB) * 100;
        
        span.setAttributes({
          "system.memory.heap_used_mb": heapUsedMB,
          "system.memory.heap_total_mb": heapTotalMB,
          "system.memory.utilization_pct": utilization,
          "system.memory.external_mb": memUsage.external / 1024 / 1024,
        });
        
        // Alert on high memory usage
        if (utilization > 85) {
          Sentry.addBreadcrumb({
            category: "system.memory",
            message: `High memory usage: ${utilization.toFixed(1)}%`,
            level: "warning",
            data: {
              heap_used_mb: heapUsedMB,
              heap_total_mb: heapTotalMB,
            },
          });
        }
      }
    );
  }, 60000); // Every 60 seconds
}
```

**Key Metrics**: `system.memory.utilization_pct`, `system.memory.heap_used_mb`  
**Sampling**: 100% when >70% utilization, 10% otherwise  
**Alert**: Sustained >85% utilization for >5 minutes

---

## 2. Business Intelligence Layer

### 2.1 Cost Attribution System

#### Event #8: LLM Token Usage & Cost Tracking
**Purpose**: Track token consumption and calculate costs per user/project/provider

```typescript
import { generateText, streamText } from "ai";

export async function trackLLMCost(
  operation: "generate" | "stream",
  params: {
    model: string;
    provider: string;
    userId: string;
    projectId?: string;
    threadId: string;
  },
  tokenUsage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  }
) {
  // Cost per 1K tokens (update with current pricing)
  const costPer1KTokens = {
    "gpt-5": { prompt: 0.15, completion: 0.60 },
    "claude-sonnet-4-5": { prompt: 0.03, completion: 0.15 },
    "gemini-2.5-pro": { prompt: 0.0125, completion: 0.05 },
    // ... other models
  };
  
  const modelCosts = costPer1KTokens[params.model as keyof typeof costPer1KTokens] || 
                     { prompt: 0, completion: 0 };
  
  const promptCost = (tokenUsage.promptTokens / 1000) * modelCosts.prompt;
  const completionCost = (tokenUsage.completionTokens / 1000) * modelCosts.completion;
  const totalCost = promptCost + completionCost;
  
  Sentry.startSpan(
    {
      name: "ai.cost_tracking",
      op: "ai.business",
      attributes: {
        "ai.provider": params.provider,
        "ai.model": params.model,
        "ai.operation": operation,
        "ai.user_id": params.userId,
        ...(params.projectId && { "ai.project_id": params.projectId }),
        "ai.thread_id": params.threadId,
        "ai.tokens.prompt": tokenUsage.promptTokens,
        "ai.tokens.completion": tokenUsage.completionTokens,
        "ai.tokens.total": tokenUsage.totalTokens,
        "ai.cost.prompt_usd": promptCost,
        "ai.cost.completion_usd": completionCost,
        "ai.cost.total_usd": totalCost,
      },
    },
    (span) => {
      // Alert on anomalous costs
      if (totalCost > 1.0) { // >$1 per request
        Sentry.addBreadcrumb({
          category: "ai.cost",
          message: `High cost request: $${totalCost.toFixed(3)}`,
          level: "warning",
          data: {
            model: params.model,
            tokens: tokenUsage.totalTokens,
          },
        });
      }
    }
  );
}

// Integrate with Vercel AI SDK
export async function costTrackedStreamText(params: any, context: any) {
  const result = await streamText({
    ...params,
    experimental_telemetry: {
      isEnabled: true,
      functionId: "chat_stream_with_cost",
    },
  });
  
  // Track cost after completion
  result.usage.then((usage) => {
    trackLLMCost("stream", context, {
      promptTokens: usage.promptTokens,
      completionTokens: usage.completionTokens,
      totalTokens: usage.totalTokens,
    });
  });
  
  return result;
}
```

**Key Metrics**: `ai.cost.total_usd`, `ai.tokens.total`, `ai.provider`, `ai.user_id`  
**Sampling**: 100% (critical business metric)  
**Alert**: Total cost/user/day >$50 OR single request >$1

#### Event #9: Provider Performance Comparison
**Purpose**: Compare latency, cost, and quality across LLM providers

```typescript
export function trackProviderMetrics(
  provider: string,
  model: string,
  metrics: {
    latency_ms: number;
    cost_usd: number;
    tokens: number;
    success: boolean;
    retryCount?: number;
  }
) {
  Sentry.setTag("provider_comparison", "active");
  
  Sentry.startSpan(
    {
      name: "ai.provider_comparison",
      op: "ai.analysis",
      attributes: {
        "ai.provider": provider,
        "ai.model": model,
        "ai.latency_ms": metrics.latency_ms,
        "ai.cost_per_1k_tokens": (metrics.cost_usd / metrics.tokens) * 1000,
        "ai.success": metrics.success,
        "ai.retry_count": metrics.retryCount || 0,
        "ai.cost_efficiency": metrics.tokens / (metrics.cost_usd * 1000), // tokens per cent
      },
    },
    () => {
      // Calculate provider health score
      const healthScore = 
        (metrics.success ? 40 : 0) +
        (metrics.latency_ms < 2000 ? 30 : metrics.latency_ms < 5000 ? 15 : 0) +
        (metrics.retryCount === 0 ? 30 : metrics.retryCount === 1 ? 15 : 0);
      
      Sentry.setContext("provider_health", {
        provider,
        model,
        health_score: healthScore,
        cost_efficiency: metrics.tokens / (metrics.cost_usd * 1000),
      });
    }
  );
}
```

**Key Metrics**: `ai.cost_per_1k_tokens`, `ai.latency_ms`, `health_score`  
**Sampling**: 20% (analytics, not critical)  
**Dashboard**: Provider comparison matrix

---

### 2.2 User Journey Funnels

#### Event #10: Authentication Journey Tracking
**Purpose**: Monitor user authentication flow and identify drop-off points

```typescript
export function trackAuthenticationJourney(
  stage: "initiated" | "email_sent" | "oauth_redirect" | "completed" | "failed",
  metadata: {
    method: "email" | "google" | "github" | "microsoft";
    userId?: string;
    error?: string;
  }
) {
  Sentry.addBreadcrumb({
    category: "user.auth",
    message: `Auth ${stage}: ${metadata.method}`,
    level: stage === "failed" ? "error" : "info",
    data: metadata,
  });
  
  // Track funnel progression
  Sentry.setTag("auth_stage", stage);
  Sentry.setTag("auth_method", metadata.method);
  
  if (stage === "completed") {
    Sentry.setUser({ id: metadata.userId });
  }
  
  if (stage === "failed") {
    Sentry.captureMessage(`Authentication failed: ${metadata.method}`, {
      level: "warning",
      tags: {
        auth_method: metadata.method,
        auth_stage: stage,
      },
      contexts: {
        auth_failure: {
          method: metadata.method,
          error: metadata.error,
        },
      },
    });
  }
}
```

**Key Metrics**: `auth_stage`, `auth_method`, conversion_rate  
**Sampling**: 100% (critical user journey)  
**Alert**: Conversion rate <70% OR >5% failures


#### Event #11: Workflow Execution Tracking
**Purpose**: Monitor custom workflow performance and state management

```typescript
export function trackWorkflowExecution(
  workflowId: string,
  metadata: {
    nodeCount: number;
    startNode: string;
    endNode?: string;
    status: "started" | "node_executed" | "completed" | "failed";
    currentNode?: string;
    error?: string;
  }
) {
  if (metadata.status === "started") {
    Sentry.startSpan(
      {
        name: "workflow.execution",
        op: "workflow.run",
        attributes: {
          "workflow.id": workflowId,
          "workflow.node_count": metadata.nodeCount,
          "workflow.start_node": metadata.startNode,
        },
      },
      () => {
        Sentry.addBreadcrumb({
          category: "workflow",
          message: `Workflow started: ${workflowId}`,
          level: "info",
          data: { node_count: metadata.nodeCount },
        });
      }
    );
  }
  
  if (metadata.status === "node_executed" && metadata.currentNode) {
    Sentry.addBreadcrumb({
      category: "workflow.execution",
      message: `Node executed: ${metadata.currentNode}`,
      level: "info",
      data: { workflow_id: workflowId, node: metadata.currentNode },
    });
  }
  
  if (metadata.status === "failed") {
    Sentry.captureMessage(`Workflow execution failed: ${workflowId}`, {
      level: "error",
      tags: {
        workflow_id: workflowId,
        failed_node: metadata.currentNode,
      },
      contexts: {
        workflow: {
          id: workflowId,
          node_count: metadata.nodeCount,
          error: metadata.error,
        },
      },
    });
  }
}
```

**Key Metrics**: `workflow.node_count`, `workflow.duration_ms`, `workflow.status`  
**Sampling**: 100% for failures, 30% for success  
**Alert**: >10% failure rate OR >30s execution time

---

## 3. Predictive & Proactive Layer

### 3.1 Trend Analysis & Anomaly Detection

#### Event #12: Performance Degradation Detection
**Purpose**: Detect gradual performance regression before user impact

```typescript
// Rolling window performance tracker
class PerformanceTrendTracker {
  private metrics: Map<string, number[]> = new Map();
  private readonly windowSize = 100; // Last 100 operations
  
  track(metricName: string, value: number) {
    if (!this.metrics.has(metricName)) {
      this.metrics.set(metricName, []);
    }
    
    const values = this.metrics.get(metricName)!;
    values.push(value);
    
    // Keep only recent window
    if (values.length > this.windowSize) {
      values.shift();
    }
    
    // Calculate baseline (first 50% of window)
    const baselineSize = Math.floor(this.windowSize / 2);
    if (values.length < baselineSize) return;
    
    const baseline = values.slice(0, baselineSize);
    const recent = values.slice(baselineSize);
    
    const baselineAvg = baseline.reduce((a, b) => a + b, 0) / baseline.length;
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    
    // Detect >20% degradation
    const degradation = ((recentAvg - baselineAvg) / baselineAvg) * 100;
    
    if (degradation > 20) {
      Sentry.captureMessage(`Performance degradation detected: ${metricName}`, {
        level: "warning",
        tags: {
          metric_name: metricName,
          degradation_pct: degradation.toFixed(1),
        },
        contexts: {
          performance_trend: {
            metric: metricName,
            baseline_avg: baselineAvg,
            recent_avg: recentAvg,
            degradation_pct: degradation,
          },
        },
      });
    }
  }
}

export const perfTracker = new PerformanceTrendTracker();

// Usage
perfTracker.track("ai.ttft_ms", 1234);
perfTracker.track("db.query_duration_ms", 45);
```

**Key Metrics**: `degradation_pct`, `baseline_avg`, `recent_avg`  
**Sampling**: 100% (critical for trend analysis)  
**Alert**: >20% degradation in any key metric

#### Event #13: Error Rate Spike Detection
**Purpose**: Detect sudden increase in error rates across services

```typescript
export function trackErrorRateSpike(
  service: string,
  errorType: string,
  currentRate: number,
  baselineRate: number
) {
  const spikeMultiplier = currentRate / baselineRate;
  
  if (spikeMultiplier > 2) { // 2x baseline
    Sentry.captureMessage(`Error rate spike detected: ${service}`, {
      level: "error",
      tags: {
        service,
        error_type: errorType,
        spike_multiplier: spikeMultiplier.toFixed(1),
      },
      contexts: {
        error_spike: {
          service,
          error_type: errorType,
          current_rate: currentRate,
          baseline_rate: baselineRate,
          spike_multiplier: spikeMultiplier,
        },
      },
    });
  }
}
```

**Key Metrics**: `spike_multiplier`, `error_type`, `service`  
**Sampling**: 100% (critical for reliability)  
**Alert**: Spike >2x baseline for >5 minutes

---

### 3.2 Failure Correlation Engine

#### Event #14: Multi-Service Failure Correlation
**Purpose**: Detect cascading failures across services

```typescript
export function correlateFailures(
  failures: Array<{
    service: string;
    timestamp: number;
    errorType: string;
    metadata?: Record<string, any>;
  }>
) {
  // Group failures within 30-second window
  const windowMs = 30000;
  const now = Date.now();
  
  const recentFailures = failures.filter(f => now - f.timestamp < windowMs);
  
  if (recentFailures.length >= 3) {
    // Detect cascade pattern
    const services = [...new Set(recentFailures.map(f => f.service))];
    
    Sentry.captureMessage(`Cascading failure detected across ${services.length} services`, {
      level: "critical",
      tags: {
        cascade_detected: "true",
        affected_services: services.length.toString(),
      },
      contexts: {
        cascade_analysis: {
          services: services.join(", "),
          failure_count: recentFailures.length,
          time_window_ms: windowMs,
          failures: recentFailures.map(f => ({
            service: f.service,
            error_type: f.errorType,
          })),
        },
      },
    });
  }
}
```

**Key Metrics**: `cascade_detected`, `affected_services`, `failure_count`  
**Sampling**: 100% (critical for system health)  
**Alert**: >3 services failing within 30s

---

### 3.3 Capacity Planning Signals

#### Event #15: Resource Saturation Warning
**Purpose**: Predict capacity exhaustion before it happens

```typescript
export function trackResourceGrowth(
  resource: "database" | "memory" | "connections" | "tokens",
  current: number,
  limit: number,
  growthRate: number // per hour
) {
  const utilizationPct = (current / limit) * 100;
  const timeToSaturation = ((limit - current) / growthRate) * 60; // minutes
  
  if (utilizationPct > 70 && timeToSaturation < 120) { // <2 hours
    Sentry.captureMessage(`Resource saturation predicted: ${resource}`, {
      level: "warning",
      tags: {
        resource_type: resource,
        utilization_pct: utilizationPct.toFixed(1),
        time_to_saturation_min: timeToSaturation.toFixed(0),
      },
      contexts: {
        capacity_planning: {
          resource,
          current,
          limit,
          growth_rate_per_hour: growthRate,
          time_to_saturation_minutes: timeToSaturation,
          utilization_pct: utilizationPct,
        },
      },
    });
  }
  
  Sentry.startSpan(
    {
      name: "capacity.resource_metrics",
      op: "capacity.planning",
      attributes: {
        "capacity.resource": resource,
        "capacity.utilization_pct": utilizationPct,
        "capacity.time_to_saturation_min": timeToSaturation,
        "capacity.growth_rate": growthRate,
      },
    },
    () => {}
  );
}
```

**Key Metrics**: `utilization_pct`, `time_to_saturation_min`, `growth_rate`  
**Sampling**: 100% (critical planning metric)  
**Alert**: Time to saturation <2 hours OR utilization >85%

---

## 4. Implementation Roadmap

### Phase 1: Foundation (Week 1)

**Goal**: Activate Vercel AI telemetry and critical performance instrumentation

**Tasks**:
1. ✅ Add `experimental_telemetry` to all `streamText` / `generateText` calls
2. ✅ Implement database query instrumentation wrapper (`instrumentedQuery`)
3. ✅ Deploy TTFT tracking for streaming responses
4. ✅ Activate connection pool monitoring

**Expected Outcomes**:
- Token usage visibility across all LLM calls
- Database slow query identification
- Streaming performance baseline established

**Effort**: 2 engineer-days

---

### Phase 2: Business Intelligence (Week 2)

**Goal**: Deploy cost attribution and user journey tracking

**Tasks**:
1. ✅ Implement LLM cost tracking system (`trackLLMCost`)
2. ✅ Add provider performance comparison (`trackProviderMetrics`)
3. ✅ Deploy authentication funnel tracking
4. ✅ Create Sentry dashboards for cost analysis

**Expected Outcomes**:
- Cost per user/project/provider visibility
- Provider comparison matrix
- Authentication conversion funnel

**Effort**: 3 engineer-days

---

### Phase 3: Proactive Monitoring (Week 3-4)

**Goal**: Enable predictive monitoring and advanced analytics

**Tasks**:
1. ✅ Deploy performance degradation detector
2. ✅ Implement N+1 query pattern detection
3. ✅ Add MCP lifecycle instrumentation
4. ✅ Configure cascade failure correlation
5. ✅ Set up capacity planning metrics

**Expected Outcomes**:
- Proactive performance alerts
- System health prediction
- Reduced MTTR by 50%+

**Effort**: 4 engineer-days

---

## 5. Advanced Event Catalog

### Complete Event Index

| # | Event Name | Category | Purpose | Sampling | Priority |
|---|-----------|----------|---------|----------|----------|
| 1 | Database Query Execution | Performance | Track query duration & slow queries | 100% slow, 20% fast | High |
| 2 | N+1 Query Detection | Performance | Identify N+1 patterns | 100% | Critical |
| 3 | Connection Pool Metrics | Performance | Monitor DB connection health | 100% | High |
| 4 | Time to First Token | Performance | Measure streaming latency | 50% | Critical |
| 5 | Stream Abandonment | Performance | Track abandonment reasons | 100% abandon, 10% complete | High |
| 6 | MCP Server Lifecycle | Reliability | Track server crashes & leaks | 100% | Critical |
| 7 | Memory Usage Sampling | Reliability | Detect memory leaks | 100% high, 10% normal | Medium |
| 8 | LLM Cost Tracking | Business | Calculate token costs | 100% | Critical |
| 9 | Provider Performance | Business | Compare providers | 20% | Medium |
| 10 | Auth Journey | Business | Track conversion funnel | 100% | High |
| 11 | Workflow Execution | Reliability | Monitor workflow health | 100% fail, 30% success | High |
| 12 | Performance Degradation | Predictive | Detect gradual regression | 100% | High |
| 13 | Error Rate Spike | Predictive | Detect error spikes | 100% | Critical |
| 14 | Failure Correlation | Predictive | Detect cascade failures | 100% | Critical |
| 15 | Capacity Planning | Predictive | Predict resource exhaustion | 100% | High |


---

## 6. Intelligent Sampling Strategy

### Dynamic Sampling Rules

```typescript
// sentry.server.config.ts
export function beforeSendTransaction(transaction: Transaction) {
  const op = transaction.contexts?.trace?.op;
  const duration = transaction.contexts?.trace?.data?.duration;
  
  // Always capture critical events
  if (
    op === "db.query" && duration > 500 || // Slow queries
    op === "mcp.lifecycle" || // MCP events
    transaction.tags?.error_rate_spike === "true" || // Error spikes
    transaction.tags?.cascade_detected === "true" // Cascading failures
  ) {
    return transaction;
  }
  
  // High sample rate for business intelligence
  if (
    op === "ai.cost_tracking" || // Cost metrics
    op === "ai.business" // Business events
  ) {
    return Math.random() < 1.0 ? transaction : null; // 100%
  }
  
  // Medium sample rate for performance
  if (
    op === "ai.streaming" || // Streaming events
    op === "db.query" // Database queries
  ) {
    return Math.random() < 0.5 ? transaction : null; // 50%
  }
  
  // Low sample rate for analytics
  if (op === "ai.analysis") {
    return Math.random() < 0.2 ? transaction : null; // 20%
  }
  
  // Default sampling
  return Math.random() < 0.1 ? transaction : null; // 10%
}
```

### Estimated Event Volume

| Category | Events/Day | Sampling | Captured/Day | Cost Impact |
|----------|-----------|----------|--------------|-------------|
| Database Queries | 500,000 | 20% + 100% slow | 100,500 | Medium |
| Streaming (TTFT) | 50,000 | 50% | 25,000 | Medium |
| LLM Cost Tracking | 50,000 | 100% | 50,000 | High |
| MCP Lifecycle | 1,000 | 100% | 1,000 | Low |
| Auth Journey | 5,000 | 100% | 5,000 | Low |
| Workflows | 10,000 | 30% + 100% fail | 4,000 | Low |
| Predictive Alerts | 500 | 100% | 500 | Low |
| **TOTAL** | **616,500** | **Various** | **186,000** | **~$300-500/mo** |

---

## 7. Alert Configuration

### Critical Alerts (Page On-Call)

```yaml
alerts:
  - name: "Database Connection Pool Exhaustion"
    condition: "db.pool.waiting > 3 for 2 minutes"
    severity: critical
    notify: ["pagerduty", "slack-critical"]
    
  - name: "LLM Cost Anomaly"
    condition: "ai.cost.total_usd > $1.00 per request OR user cost > $50/day"
    severity: critical
    notify: ["slack-ops", "email-finance"]
    
  - name: "Cascading Failure Detected"
    condition: "cascade_detected = true"
    severity: critical
    notify: ["pagerduty", "slack-critical"]
    
  - name: "MCP Server Crash Storm"
    condition: ">3 mcp server crashes per hour"
    severity: critical
    notify: ["pagerduty", "slack-ops"]
```

### Warning Alerts (Slack Notification)

```yaml
  - name: "Performance Degradation"
    condition: "degradation_pct > 20% for 10 minutes"
    severity: warning
    notify: ["slack-eng"]
    
  - name: "N+1 Query Pattern Detected"
    condition: "n1_pattern detected"
    severity: warning
    notify: ["slack-eng", "github-issue"]
    
  - name: "High Memory Usage"
    condition: "system.memory.utilization_pct > 85% for 5 minutes"
    severity: warning
    notify: ["slack-ops"]
    
  - name: "Stream Abandonment Rate High"
    condition: "abandonment_rate > 10% excluding client_disconnect"
    severity: warning
    notify: ["slack-product"]
```

### Informational Alerts (Dashboard Only)

```yaml
  - name: "Capacity Planning Warning"
    condition: "time_to_saturation < 2 hours"
    severity: info
    notify: ["slack-ops"]
    action: "Review capacity planning"
    
  - name: "Provider Performance Comparison"
    condition: "health_score < 50 for any provider"
    severity: info
    notify: ["dashboard"]
    action: "Consider provider switch"
```

---

## 8. Dashboard Design

### Executive Dashboard

**Metrics**:
- Daily LLM cost by provider
- Cost per user (top 10)
- Authentication conversion funnel
- System health score (0-100)

**Visualizations**:
- Cost trend line (7-day, 30-day)
- Provider comparison matrix
- User journey funnel
- Capacity utilization gauges

### Engineering Dashboard

**Metrics**:
- p50, p95, p99 latency by operation
- Database query performance
- N+1 query detection count
- Error rate by service

**Visualizations**:
- Latency distribution heatmap
- Slow query breakdown
- Error spike timeline
- Resource utilization graphs

### Operations Dashboard

**Metrics**:
- Active alerts count
- MTTR (Mean Time To Resolution)
- System uptime
- Resource saturation warnings

**Visualizations**:
- Alert timeline
- Service dependency graph
- Capacity planning projections
- Failure correlation matrix

---

## 9. Success Metrics & ROI

### Key Performance Indicators

| Metric | Baseline | Target | Timeframe |
|--------|----------|--------|-----------|
| MTTR (Mean Time To Resolution) | 45 min | <20 min | 3 months |
| MTTD (Mean Time To Detection) | 15 min | <5 min | 2 months |
| Prevented Outages | 0/month | 2+/month | 3 months |
| Cost Savings (LLM optimization) | - | 15-20% | 4 months |
| Database Query Optimization | - | 30% faster p95 | 3 months |

### ROI Calculation

**Investment**:
- Implementation: 9 engineer-days (~$9,000)
- Sentry additional cost: ~$400/month
- Maintenance: 2 hours/week (~$200/month)

**Total Year 1**: ~$15,600

**Returns**:
- LLM cost reduction (15%): ~$18,000/year (assuming $10k/month baseline)
- Prevented outages (2/month): ~$50,000/year (estimated revenue protection)
- Faster incident resolution: ~$12,000/year (reduced engineering time)

**Total ROI**: ~$80,000/year = **410% ROI**

---

## 10. Conclusion & Next Steps

### What We've Built

This strategy transforms Sentry from basic error tracking into an enterprise-grade observability platform providing:

✅ **Performance Visibility**: Database, streaming, and resource monitoring  
✅ **Business Intelligence**: Cost attribution, user funnels, quality metrics  
✅ **Predictive Monitoring**: Trend analysis, failure correlation, capacity planning  
✅ **Actionable Insights**: 15 advanced events with concrete code examples  

### Immediate Next Steps

1. **Week 1**: Review and approve this strategy with engineering leadership
2. **Week 1**: Begin Phase 1 implementation (Vercel AI telemetry + database instrumentation)
3. **Week 2**: Deploy Phase 2 (Cost tracking + business intelligence)
4. **Week 3-4**: Complete Phase 3 (Predictive monitoring)
5. **Week 5**: Configure alerts and dashboards
6. **Week 6**: Monitor, tune, and optimize

### Long-Term Vision

With this monitoring foundation, you can:
- **Scale confidently** knowing you'll detect issues before users
- **Optimize costs** with real-time LLM usage and provider insights
- **Make data-driven decisions** using user journey and quality metrics
- **Predict failures** before they impact production

---

## Appendix A: Additional Resources

### Sentry Documentation
- [Next.js Performance Monitoring](https://docs.sentry.io/platforms/javascript/guides/nextjs/tracing/)
- [Vercel AI SDK Integration](https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/integrations/vercelai/)
- [Dynamic Sampling](https://docs.sentry.io/organization/dynamic-sampling/)
- [Metric Alerts](https://docs.sentry.io/product/alerts/create-alerts/metric-alert-config/)

### Best Practices
- [Database Query Insights](https://docs.sentry.io/product/performance/queries/)
- [Release Tracking](https://docs.sentry.io/product/releases/)
- [Breadcrumbs Guide](https://docs.sentry.io/platforms/javascript/guides/nextjs/enriching-events/breadcrumbs/)

---

**Document Version**: 1.0  
**Last Updated**: 2025-11-06  
**Authors**: Codegen AI Agent  
**Status**: Ready for Implementation

---

*For questions or implementation support, refer to the Sentry SDK documentation or reach out to your DevOps team.*

