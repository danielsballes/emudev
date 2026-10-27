<!--
The PR title must follow Conventional Commits, for example:
  feat(chip8): add DXYN draw instruction lesson
  fix(runner): terminate worker on timeout
PRs are squash-merged, so the title becomes the commit analyzed by semantic-release.
Write the title and description in English.
-->

## Summary

<!-- What changes and why. Link the issue if there is one: Closes #123 -->

## Type of change

- [ ] `feat`: new feature
- [ ] `fix`: bug fix
- [ ] `docs`: documentation only
- [ ] `refactor`: code change without behavior change
- [ ] `test`: adds or fixes tests
- [ ] `chore` / `ci` / `build`: tooling, dependencies, pipelines

## Affected area

- [ ] Engine (registry, storage, runner, progression)
- [ ] RPG shell / UI
- [ ] Themes / eras
- [ ] Module: <!-- e.g. chip8 -->
- [ ] CI/CD / tooling

## How to test

1.
2.

## Screenshots

<!-- Required when the UI changes. Include every era affected. -->

## Checklist

- [ ] `npm run lint` and `npm run format:check` pass with no warnings
- [ ] `npm run test:coverage` passes and covers the new code
- [ ] `npm run build` works
- [ ] User-facing text lives in `src/i18n/locales` or in module content (nothing hardcoded)
- [ ] Code, comments, commits and this PR are in English
- [ ] Third-party ROMs or assets have their license documented
- [ ] Breaking changes are described (`BREAKING CHANGE:` in the commit body)
