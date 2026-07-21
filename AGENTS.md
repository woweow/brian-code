This is a hackathon/proof of concept/educational chat app that is never intended to land in production. We should never care about backwards compatability. We should write minimal tests which only cover critical scenarios. We should always imagine that the next feature radically changes the system.

`better-sqlite3` is native: Electron and Node need different builds. `npm run desktop` / `desktop:dev` rebuild for Electron; `npm test` rebuilds for Node. Flip manually with `npm run rebuild:native:electron` or `npm run rebuild:native:node`.
