FROM qdrant/qdrant:latest

EXPOSE 6333 6334

ENV QDRANT__SERVICE__HTTP_PORT=${PORT:-6333}

CMD ["qdrant"]
