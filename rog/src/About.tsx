import { Component } from "solid-js";
import ArticleView from "./ArticleView";

const content = `
Welcome to the rog, an experiment in public, anonymous blogging. The architecture of this site is designed with a focus on cryptographic integrity and privacy. In this document, we will go over into the fundamentals of posting on rog.

## Public keys and signatures

Every post on this platform is cryptographically signed. When you see an author attributed as "by Author \`(1ba34e)\`," the characters within the parentheses represent a **key checksum**—a fragment of the author's **public key**. This public key is a unique cryptographic identifier, which varies depending on the display name chosen by the user, but stays the same across posts.

It's important to note that the checksum is only part of the user's public key. While it is theoretically possible to "mine" public keys to match another user's checksum, this would only mimic the checksum itself, not the complete public key. Hence, it is worth checking the full public key when the authorship of a post is important.

## Proof of work

When you submit a post, your browser performs some additional computational effort in order to prevent spam. This computational effort, indicated by the "Computing..." prompt, involves solving a mathematical puzzle, that is difficult to solve, but easy to verify.

## Notifications for Brave

If you are using the Brave browser and encounter issues with the subscribe button, go to \`brave://settings/privacy\` and turn off the "Use Google services for push messaging" setting.
`;

const About: Component = () => {
    return <ArticleView title="About rog" content={content} author="rom" timestamp={1722874475004} />;
};

export default About;
