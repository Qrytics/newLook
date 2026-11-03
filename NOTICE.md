# Third-party notices

newLook bundles unmodified copies of three open-source skills so that one clone works offline.
Each keeps its own MIT license file inside its folder. The `frontend-design` skill is the only
original piece; it routes between the three.

| Folder | Project | Author | License | Upstream |
|---|---|---|---|---|
| `skills/hallmark` | Hallmark | Hallmark contributors (Together AI) | MIT | https://github.com/nutlope/hallmark |
| `skills/interface-design` | Interface Design | Damola Akinleye | MIT | https://github.com/Dammyjay93/interface-design |
| `skills/typography` | Practical Typography skill | danium | MIT | https://github.com/danium/practicaltypography |

`skills/typography` is an independent paraphrase of Matthew Butterick's *Practical Typography* and is
not affiliated with him.

Copies were taken from a working install on 2026-11-02 and may lag upstream. To update one, replace its
folder with a fresh copy from the upstream repo and keep its LICENSE.

## Not bundled

The libraries below are optional tools the `frontend-design` skill can use. They are installed per
project when needed and are not part of this repo:
`@react-three/fiber` (MIT), `@shadergradient/react` (MIT), `dashersw/liquid-glass-js` (MIT).
