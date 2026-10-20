export async function onRequestGet({ env, request, waitUntil }) {
    const empty = emptyStats();
    if (!env.GITHUB_TOKEN) {
        return jsonResponse(empty);
    }

    let result = await caches.default.match(request.url);
    if (result) {
        result = await result.json();
        if (!Array.isArray(result) || result.length !== 11) result = null;
    }

    if (!result) {
        result = await fetchData(env);
        waitUntil(updateCache(request.url, result));
    } else {
        waitUntil(fetchData(env).then(data => updateCache(request.url, data)));
    }

    return jsonResponse(result);
}

function jsonResponse(data) {
    return new Response(JSON.stringify(data), {
        headers: {
            'content-type': 'application/json',
            'cache-control': 'no-cache, no-store, must-revalidate, max-age=0'
        }
    });
}

function emptyStats() {
    return [
        ...Array.from({ length: 10 }, () => ['-', '-']),
        Array(6).fill('-')
    ];
}

async function fetchData(env) {
    const query = `{
        a: repository(owner: "itsfourvn", name: "Chill-House-Discord-Bot") { stargazers { totalCount } forks { totalCount } }
        b: repository(owner: "itsfourvn", name: "stelladb") { stargazers { totalCount } forks { totalCount } }
        c: repository(owner: "itsfourvn", name: "userplugins") { stargazers { totalCount } forks { totalCount } }
        d: repository(owner: "itsfourvn", name: "themes") { stargazers { totalCount } forks { totalCount } }
        e: repository(owner: "itsfourvn", name: "highlight") { stargazers { totalCount } forks { totalCount } }
        f: repository(owner: "itsfourvn", name: "userscript") { stargazers { totalCount } forks { totalCount } }
        g: repository(owner: "itsfourvn", name: "autumn") { stargazers { totalCount } forks { totalCount } }
        h: repository(owner: "itsfourvn", name: "osu-mpbd") { stargazers { totalCount } forks { totalCount } }
        i: repository(owner: "itsfourvn", name: "osu-ubu") { stargazers { totalCount } forks { totalCount } }
        j: repository(owner: "itsfourvn", name: "bot") { stargazers { totalCount } forks { totalCount } }
        z: user(login: "itsfourvn") {
            repositories(first: 100, ownerAffiliations: OWNER) {
                nodes { stargazerCount forkCount }
            }
            contributionsCollection { totalCommitContributions }
            pullRequests(first: 1) { totalCount }
            issues(first: 1) { totalCount }
            repositoriesContributedTo(first: 1, contributionTypes: [COMMIT, ISSUE, PULL_REQUEST, REPOSITORY]) { totalCount }
        }
    }`;

    try {
        const response = await fetch('https://api.github.com/graphql', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'authorization': `bearer ${env.GITHUB_TOKEN}`,
                'user-agent': 'itsfouvn'
            },
            body: JSON.stringify({ query })
        });
        const payload = await response.json();
        const data = payload.data;
        if (!response.ok || payload.errors?.length || !data?.z) return emptyStats();

        const repoStats = 'abcdefghij'.split('').map(key => {
            const repo = data[key];
            return repo ? [repo.stargazers.totalCount, repo.forks.totalCount] : ['-', '-'];
        });
        const profile = data.z;
        const stats = [
            profile.repositories.nodes.reduce((sum, repo) => sum + repo.stargazerCount, 0),
            profile.repositories.nodes.reduce((sum, repo) => sum + repo.forkCount, 0),
            profile.contributionsCollection.totalCommitContributions,
            profile.pullRequests.totalCount,
            profile.issues.totalCount,
            profile.repositoriesContributedTo.totalCount
        ];
        return [...repoStats, stats];
    } catch {
        return emptyStats();
    }
}

async function updateCache(url, data) {
    if (data === undefined) return;
    await caches.default.put(url, new Response(JSON.stringify(data), {
        headers: {
            'content-type': 'application/json',
            'cache-control': 'public, max-age=3600'
        }
    }));
}