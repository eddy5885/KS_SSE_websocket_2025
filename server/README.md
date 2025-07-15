# SSE打字效果演示

```
# 非流式
curl -X POST "http://127.0.0.1:3000/api/chat" -H "Content-Type: application/json" -H "User-Agent: PostmanRuntime/7.43.0" -H "Accept: */*" -H "Postman-Token: 986e55c3-9fc1-40bb-a744-47df332b6fa0" -H "Host: 127.0.0.1:3000" -H "Connection: keep-alive" --data-raw '{
    "prompt":"react介绍"
}'

# 流式
curl -X POST "http://127.0.0.1:3000/api/chatStream" -H "Content-Type: application/json" -H "User-Agent: PostmanRuntime/7.43.0" -H "Accept: */*" -H "Postman-Token: b0143a45-cbcc-488f-a154-c41ed9e278d5" -H "Host: 127.0.0.1:3000" -H "Connection: keep-alive" --data-raw '{
    "prompt":"react介绍"
}'
```
