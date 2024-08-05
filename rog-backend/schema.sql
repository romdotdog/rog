CREATE TABLE posts (
    hash BLOB PRIMARY KEY,
    author TEXT NOT NULL,
    content TEXT NOT NULL,
    preview TEXT NOT NULL,
    key BLOB NOT NULL,
    signature BLOB NOT NULL,
    timestamp INTEGER NOT NULL,
    participating INTEGER NOT NULL DEFAULT 1,
    replyingTo BLOB
);

CREATE TRIGGER update_participating_after_insert
AFTER INSERT ON posts
FOR EACH ROW
WHEN NEW.replyingTo IS NOT NULL
BEGIN
    UPDATE posts
    SET participating = participating + 1
    WHERE hash IN (
        WITH RECURSIVE Ancestors AS (
            SELECT replyingTo
            FROM posts
            WHERE hash = NEW.hash

            UNION ALL

            SELECT p.replyingTo
            FROM posts p
            INNER JOIN Ancestors a ON p.hash = a.replyingTo
        )
        SELECT replyingTo FROM Ancestors
    );
END;
