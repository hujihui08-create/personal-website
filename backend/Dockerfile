FROM golang:1.21-alpine AS builder

ENV GOPROXY=https://goproxy.cn,https://goproxy.io,direct

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o server ./cmd/server

FROM alpine:3.20

WORKDIR /app

RUN apk add --no-cache ca-certificates && adduser -D -g '' appuser

COPY --from=builder /app/server /app/server

USER appuser

EXPOSE 8080

ENTRYPOINT ["/app/server"]
