local BazelRulesSnapshot(user, repo, revision, target='', release=false) = {
  local location = if release then std.format('releases/download/%s', revision) else 'archive',
  local name = if release then std.format('%s-%s', [repo, revision]) else revision,
  url: std.format('https://github.com/%s/%s/%s/%s.tar.gz', [user, repo, location, name]),
  dest: std.format('third_party/%s', if std.length(target) != 0 then target else repo),
  arc: { [if !release then 'prefix' else null]: std.format('%s-%s', [repo, revision]) },
};

local OfficialBazelRulesSnapshot(repo, revision, release=false) =
  BazelRulesSnapshot('bazelbuild', repo, revision, release=release);

local versions = {
  bazel: '3.3.1',
  rules_nodejs: '1.7.0',
  rules_sass: '1.26.10',
};

{
  files: [
    {
      url: std.format('https://github.com/bazelbuild/bazel/releases/download/%s/bazel-%s-linux-x86_64', [versions.bazel, versions.bazel]),
      dest: 'third_party/bazel/bazel',
    },
    OfficialBazelRulesSnapshot('rules_nodejs', versions.rules_nodejs, release=true),
    OfficialBazelRulesSnapshot('rules_sass', versions.rules_sass),
  ],
}
