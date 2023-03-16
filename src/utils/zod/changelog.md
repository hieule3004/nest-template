** Copy and modified from https://github.com/risenforces/nestjs-zod (MIT license)
- use `z` from `zod` instead of `nestjs-zod/z` for compatibility
- fix `validate.ts` and `pipe.ts` to work at compile time (instead of precompiled lib)
- update `zodToOpenApi` to match `zod@3.19.1`
    - refactor to lookup methods for exhaustive pattern matching on `ZodType`
    - `string`: update `check.kind` for `startsWith`, `endWiths`, `trim`
    - `intersection`: fix merge deep to work, also merge return unique array 
    - implement mapper for all `ZodType` explicitly
- add global pipe provider