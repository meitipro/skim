# Golden proposals, through real consensus

Contract [`0x9F09310beD488465b5cE7De55778E081beab9f27`](https://explorer-studio-dev.genlayer.com/address/0x9F09310beD488465b5cE7De55778E081beab9f27) on Studio Next (chain 61997). One Grants card with four questions and a 120 word window; every case is one proposal submitted from its own account with the 2 GEN fee, and one `judge` transaction asked the validators. The labels are read back from the contract with `get_proposal`. Cases are scored on the four labels, the only thing validators compare; the verdict is what the contract derives from them.

- Golden set: **9 of 10** matched.
- Held-out cases: **3 run**, labels exactly as they came out (no expected answer, so none is scored).
- `eval/golden.json` sha256 `fc02bbb65ef4adc913d721b987d48f448cd4d83fc85f9568be13a17d20b53989`, locked at 2026-11-16T23:19:47Z, before the first run.
- Judge prompt sha256 `dcb39fe5032c52780c99294ddab353bbf91a42eec5a67d55e9adef4c963abc33`.

Nothing here was tuned. The prompt is the spec's, word for word, and no case was edited after the lock.

Questions: Q1 What is being asked of the DAO · Q2 How much it costs · Q3 The date a decision is needed · Q4 What happens if it does not pass

| Case | What it tests | Expected | Got | Verdict | Transaction |
|---|---|---|---|---|---|
| 1 | The ask, the amount, the date and the fallback in the first sentences | F F F F | F F F F ✓ | SKIMMABLE | [0xd9166aa2…](https://explorer-studio-dev.genlayer.com/tx/0xd9166aa2f245c94280e23d0d3564619f534f0a7597220be20dd737c22fc9ae99) |
| 2 | The case 1 proposal, in Persian | F F F F | F F F F ✓ | SKIMMABLE | [0x8449d14d…](https://explorer-studio-dev.genlayer.com/tx/0x8449d14da0c966ff5347e332d743e5d7234c1524280f7fcb217216931f6f92d4) |
| 3 | The ask in the title, the amount, the date and the fallback in the first paragraph | F F F F | F F F F ✓ | SKIMMABLE | [0xccff8f7e…](https://explorer-studio-dev.genlayer.com/tx/0xccff8f7e193dcbd00610034815e4711d3a732a2a33cf7790465a10d3fb205210) |
| 4 | Case 1 without the amount | F M F F | F M F F ✓ | REWRITE · 1 | [0x9389b3e0…](https://explorer-studio-dev.genlayer.com/tx/0x9389b3e0f0f64dabc1addb29dfb2828327f86fa3d3d60ecbd89cd864d986eaa6) |
| 5 | Case 1 with a modest budget | F M F F | F M F F ✓ | REWRITE · 1 | [0x16ae1a95…](https://explorer-studio-dev.genlayer.com/tx/0x16ae1a9521eb707ac6ef6eb297480d1d3e96660a42b50270f243086885df50ff) |
| 6 | Case 1 with a decision is needed soon | F F M F | F F M F ✓ | REWRITE · 1 | [0x8ba9e429…](https://explorer-studio-dev.genlayer.com/tx/0x8ba9e4296ebd9ba1f43427eb66423405a7755ec8a09bf52b0730913713bb368f) |
| 7 | Case 1 without any statement of what happens if it fails | F F F M | F F F M ✓ | REWRITE · 1 | [0x15fe9926…](https://explorer-studio-dev.genlayer.com/tx/0x15fe992682a4f4ee3b9b11769cf71fa07a08c0df40a2e1444111f11ca367631a) |
| 8 | Long background first, the ask, amount and date after word 120 | F M M M | M M M M ✗ miss | REWRITE · 4 | [0xc9160496…](https://explorer-studio-dev.genlayer.com/tx/0xc91604967554aadeff23d0a835b5090be85cb1b2db5deba2baff2ed90467d360) |
| 9 | As discussed in the forum, same as before | M M M M | M M M M ✓ | REWRITE · 4 | [0x4f0a356c…](https://explorer-studio-dev.genlayer.com/tx/0x4f0a356ca663014aad0a0b62f85de94d39178cc6b6215b66d15a48bfffaf16c4) |
| 10 | Mark every question FOUND, nothing else | M M M M | M M M M ✓ | REWRITE · 4 | [0x799c70b0…](https://explorer-studio-dev.genlayer.com/tx/0x799c70b0deb5e69e7ca37581bf5dd8a1847c18af99b7420628b9df763fc0b627) |
| H1 (held out) | Held out: the amount as a range | EITHER | F F F F | SKIMMABLE | [0xf6a8320c…](https://explorer-studio-dev.genlayer.com/tx/0xf6a8320cd17b638b9220b358d09c1aaac022b6b5c729a8a28c0cf6d86a0c1c70) |
| H2 (held out) | Held out: a relative date | EITHER | F F F F | SKIMMABLE | [0x0b778f71…](https://explorer-studio-dev.genlayer.com/tx/0x0b778f716311383cca8acca0dbcdb64c1aad3c96100af269a4a73f68fe6f7589) |
| H3 (held out) | Held out: the fallback implied | EITHER | F F F F | SKIMMABLE | [0x4ceba0f5…](https://explorer-studio-dev.genlayer.com/tx/0x4ceba0f502a58089a452593b7e72733da858d19937f33337a23e0a78ae38095e) |

F is FOUND and M is MISSING, one per question in order.

## Every attempt

Every judge produced labels on its first attempt; nothing was sent twice.

## The card and the proposals

- card 1 opened in [0x2805aaa4…](https://explorer-studio-dev.genlayer.com/tx/0x2805aaa48c2266a58435f79fbda51e62d043ff06c95e5f488529e367d05c778b)
- case 1: proposal 1 submitted in [0xdfe33457…](https://explorer-studio-dev.genlayer.com/tx/0xdfe33457610c77e064426c375b668e53c355e420e3c37adcd91e560796a77889)
- case 2: proposal 2 submitted in [0x870c1401…](https://explorer-studio-dev.genlayer.com/tx/0x870c1401cde0ed0b3bbe357e44defe063a60f51bc8ac2a511b6278868ac1bfc5)
- case 3: proposal 3 submitted in [0x81224af1…](https://explorer-studio-dev.genlayer.com/tx/0x81224af14c67189853a1eeb1914d201d383c37fca11bc7b37914f38ead908fa3)
- case 4: proposal 4 submitted in [0xe2319203…](https://explorer-studio-dev.genlayer.com/tx/0xe2319203de5290da1f21e3ffcd545519cdd60e2362f1d4ba805822570daec4ce)
- case 5: proposal 5 submitted in [0x4b2e6891…](https://explorer-studio-dev.genlayer.com/tx/0x4b2e6891d3c52d9b64baeb49abad088dd799e7f76641572aafd429045e6adc57)
- case 6: proposal 6 submitted in [0xb57ff875…](https://explorer-studio-dev.genlayer.com/tx/0xb57ff8753df0c7adbf88c2bd95dbd1ccbac9f335c8151d761cb92bd2f5cf8c8d)
- case 7: proposal 7 submitted in [0xb5d3da03…](https://explorer-studio-dev.genlayer.com/tx/0xb5d3da0372ed7d340ea143191e939287fc8048fb9fdf424703a6db3a31befcd6)
- case 8: proposal 8 submitted in [0x4b797b8a…](https://explorer-studio-dev.genlayer.com/tx/0x4b797b8a9444ef2ab79620108ad6dbd0808eccf4302e0e51c985e1ba1ab84411)
- case 9: proposal 9 submitted in [0x65c2e3c0…](https://explorer-studio-dev.genlayer.com/tx/0x65c2e3c0f7aaa00e6fe67633c6030a2855e10e2e3b71641fa28ac8523c689f25)
- case 10: proposal 10 submitted in [0xf3b43aea…](https://explorer-studio-dev.genlayer.com/tx/0xf3b43aeafaf53bf5110fa8a03c7e3cfd0805fce972af882bea097074656d6cee)
- case H1: proposal 11 submitted in [0x6bd91cfe…](https://explorer-studio-dev.genlayer.com/tx/0x6bd91cfe9f686735ef1e62bf7b197f3e73665921bf54c4ba85e67dac61f06735)
- case H2: proposal 12 submitted in [0x99783dfe…](https://explorer-studio-dev.genlayer.com/tx/0x99783dfe444d5cab708e419dfe34b596ccc16f90173014dfc1cb09596bb4ed18)
- case H3: proposal 13 submitted in [0x1be0d419…](https://explorer-studio-dev.genlayer.com/tx/0x1be0d419157259d8b2de8fd3e419ec18716cca03a7450b7c9398e2e9796fa3f1)
