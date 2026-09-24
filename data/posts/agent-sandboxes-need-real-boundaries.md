---
title: "An Agent Sandbox Is Useful Only When It Has Real Boundaries"
date: "2026-09-25"
status: "published"
publishedAt: "2026-09-25T00:44:00+02:00"
updatedAt: "2026-09-25T00:44:00+02:00"
author: "Prashant Choudhary"
excerpt: "GitHub's new local sandboxing preview is a useful reminder that an approval dialog and an enforceable boundary solve different problems."
tags: ["AI agents", "developer tools", "security", "GitHub Copilot"]
published: true
---

# An Agent Sandbox Is Useful Only When It Has Real Boundaries

Coding agents have made a slightly awkward question feel ordinary: what, exactly, are we allowing a helpful program to touch on our laptops?

It is tempting to answer with a pop-up. “Allow this command?” looks responsible, and sometimes it is. But an approval prompt is a moment of human judgement; a sandbox is a technical boundary that still applies after the moment has passed. Confusing the two is how “I thought it was restricted” becomes the least satisfying line in an incident write-up.

[GitHub’s September 23 announcement](https://github.blog/changelog/2026-09-23-local-sandboxing-in-the-github-copilot-app/) of local sandboxing for repository and working-tree sessions in the GitHub Copilot app is interesting for that reason. The public-preview feature lets a project request limits over filesystem access, network access, and selected credentials. Crucially, GitHub says the sandboxed shell errors if the operating system cannot enforce the requested policy instead of quietly continuing without a sandbox. That fail-closed detail is the headline, even if it is not the part most likely to make a launch graphic.

## A prompt asks a question; a sandbox changes the possible answers

Approval controls are valuable. They can stop a surprising command before it runs and make an agent’s plan inspectable. They are especially useful when a task has a small number of consequential actions: run a migration, change a deployment setting, send a request with a production token.

But prompts have a built-in weakness: they ask a person to understand an action under time pressure, often from a compact description. That gets harder when the action is a shell command assembled by an agent, a chain of tools, or a perfectly innocent-looking script with an unfortunate environment variable. A person can approve a command that sounds like it reads a repository while missing that it can also traverse a parent directory or call out to the internet.

A sandbox answers a different question: assuming the agent or reviewer is mistaken, what can the process actually reach? That is a better place to put a boring, mechanical rule. The process should not be able to read the SSH directory, connect to an arbitrary internal service, or inherit a broadly useful credential merely because a previous step seemed reasonable. [Better prompts](https://prashant.sbs/en/blog/posts/mastering-prompt-engineering) can make instructions clearer; they cannot enforce a filesystem rule.

[GitHub describes three policy areas](https://docs.github.com/en/copilot/concepts/security-governance-and-network-settings/about-cloud-and-local-sandboxes#configuring-local-sandboxing) in this preview: extra read/write, read-only, and denied filesystem locations; outbound-internet and local-network access; and Git or GitHub CLI credentials. These are not magical protections. They are a way to reduce the blast radius of a wrong tool call. “Reduce” matters here. It is much more credible than calling an agent safe by default and hoping nobody asks what default means.

## Fail closed is a product decision, not a fussy implementation detail

The most reassuring line in the announcement is that an unsupported policy produces an error rather than an unsandboxed shell. A boundary that disappears when enforcement is inconvenient is not a boundary; it is a strongly worded suggestion with excellent timing.

This distinction shows up in ordinary engineering too. A deployment check that silently skips because its credentials are unavailable has not verified the deployment. A backup job that reports success after ignoring permission errors has not made a backup. Likewise, an agent session that silently loses its confinement should not keep working as though nothing material changed.

There is a cost. A fail-closed system can interrupt work, and local environments are uneven. The same project may run on different operating systems, container setups, corporate endpoint policies, or developer machines with very different capabilities. The resulting failure message needs to be actionable: which requested boundary could not be enforced, why, and what safer configuration is available? “Sandbox failed” is a fine start for a log, not for a developer trying to finish a patch before lunch.

Still, interruption is the honest outcome. A tool that cannot provide the protection it advertised should make that visible. Reliability is not the absence of errors; it is the absence of successful-looking errors.

## Start with the repository, then deliberately shrink the world

The useful setup is rarely “give the agent the whole machine, but please be careful.” Start with the smallest workspace the task needs. Make other directories denied by default. If a generator needs a read-only design-assets folder or a temporary output directory, add that deliberately and document why.

Network policy deserves the same treatment. Many coding tasks do not need open outbound access for their entire lifetime. Dependency installation, documentation lookup, local testing, and a production API call have different risk profiles. Splitting a workflow into phases can be less glamorous than a one-click autonomous run, but it makes the security story legible. An agent can have network access while resolving a package, then run tests with no network and no production credentials. That is not paranoia; it is just refusing to make every capability permanent.

Credentials are the sharpest edge. GitHub’s announcement calls out Git credentials for authenticated HTTPS operations and GitHub CLI credentials separately. That specificity is helpful because “access to the repository” is not one thing. A read-only token, a deploy key, a personal GitHub CLI session, and a cloud credential in an environment variable carry very different consequences. Give a session the narrowest credential it needs, for the shortest useful period, and assume an agent can accidentally expose whatever it can read. [A local AI tooling setup](https://prashant.sbs/en/blog/posts/use-gpt-claude-and-gemini-models-inside-claude-code-on-windows-with-cliproxyapi) is a useful place to inventory which tokens and configuration directories exist before granting an agent access.

None of this replaces review. A sandbox may prevent a process from reaching a secret, but it cannot tell whether a changed authorization check is correct. An approval gate may catch a suspicious request, but it cannot reliably constrain every command approved during a long session. Good agent workflows layer controls because each control has blind spots.

## Preview means test the boundary, not just the feature

[GitHub labels local sandboxing a public preview](https://github.blog/changelog/2026-09-23-local-sandboxing-in-the-github-copilot-app/), says it is off by default, and scopes project-default changes to new sessions or restarted existing sessions. It also says the local Copilot app’s settings are separate from Copilot CLI settings, and that the feature does not apply to cloud-sandbox or remote-host sessions. An active local session can be switched on with `/sandbox on`. Those limitations are not footnotes to skip. They are the map of where an organisation can accidentally assume a control exists when it does not.

[GitHub’s documentation](https://docs.github.com/en/copilot/concepts/security-governance-and-network-settings/about-cloud-and-local-sandboxes#how-local-sandboxing-works) describes local sandboxing as operating-system containment, not a separate virtual machine. In the app, an individual command can also be approved to run outside the sandbox. That exception may be necessary for a real task, but the sandbox does not cover that command. Treat each bypass as a new access decision.

Before a team treats the feature as policy, it should run small negative tests. Can a sandboxed session read a deliberately denied directory? Can it reach a blocked endpoint? Does it receive a credential that was meant to be absent? Does the session refuse to start when the host cannot implement the selected policy? Record the result per supported environment. This is not a call to turn developers into full-time red-teamers; it is a reminder that a security setting is only as useful as its observed behaviour.

There is also a human factor. If every harmless task trips a vague sandbox failure, people will route around it. The better response is not to remove the boundary wholesale. It is to improve project defaults, make exceptions visible, and keep the exception small enough that a reviewer can understand it without needing a forensic kit.

## The practical takeaway

Local sandboxing will not settle the larger question of how much autonomy a coding agent should have. It does offer a healthier framing: do not judge an agent system only by how politely it asks for permission. Judge it by what it can do when permission, prompting, or reasoning fails.

For an individual developer, the next useful step is modest: identify one repository task that does not need your home directory, internal network, or long-lived credentials, and run it with those things unavailable. For a team, write down the minimum filesystem, network, and credential policy for common agent tasks, then test the policy’s failure mode as seriously as its happy path.

The goal is not to make coding agents feel like they are working in a submarine. It is to give them a sensible room to work in, lock the door to the server room, and verify that the lock is actually attached to the door.

## Sources

- [GitHub Changelog: Local sandboxing in the GitHub Copilot app](https://github.blog/changelog/2026-09-23-local-sandboxing-in-the-github-copilot-app/)
- [GitHub Docs: About cloud and local sandboxes for GitHub Copilot](https://docs.github.com/en/copilot/concepts/security-governance-and-network-settings/about-cloud-and-local-sandboxes)
