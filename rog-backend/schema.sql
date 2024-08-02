CREATE TABLE posts (
    hash BLOB PRIMARY KEY,
    author TEXT NOT NULL,
    content TEXT NOT NULL,
    preview TEXT NOT NULL,
    keyChecksum BLOB NOT NULL,
    key BLOB NOT NULL,
    signature BLOB NOT NULL,
    timestamp INTEGER NOT NULL
);