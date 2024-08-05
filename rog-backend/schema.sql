CREATE TABLE posts (
    hash BLOB PRIMARY KEY,
    author TEXT NOT NULL,
    content TEXT NOT NULL,
    preview TEXT NOT NULL,
    keyChecksum BLOB NOT NULL,
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
    SET participating = (
        WITH RECURSIVE Descendants AS (
            SELECT p.key, p.hash
            FROM posts p
            WHERE p.hash = posts.hash
            
            UNION ALL
            
            SELECT p.key, p.hash
            FROM posts p
            INNER JOIN Descendants d ON p.replyingTo = d.hash
        )
        SELECT COUNT(DISTINCT d.key)
        FROM Descendants d
    )
    WHERE hash IN (
        WITH RECURSIVE Ancestors AS (
            SELECT replyingTo, hash
            FROM posts
            WHERE hash = NEW.hash
            
            UNION ALL
            
            SELECT p.replyingTo, p.hash
            FROM posts p
            INNER JOIN Ancestors a ON p.hash = a.replyingTo
        )
        SELECT hash FROM Ancestors
    );
END;