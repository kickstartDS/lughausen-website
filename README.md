# kickstartDS Storyblok starter

1. Clone our Starter space by visiting https://app.storyblok.com/#!/build/242426.
2. Clone `energyui-storyblok-starter`-Repo by clicking on "Use this template"
   -> "Create new repository".
3. Go to Vercel and click on "Add New..." -> "Project". Import your cloned
   Github Repository. Unfold "Environment Variables" and add the following:
   - `NPM_RC` with `//<your package registry>:_authToken=<your npm token>`
   - `STORYBLOK_API_TOKEN` with a preview token from the cloned Stroyblok
     Space above.
4. Click on "Deploy"
5. Configure your freshly deployt App as the default preview URL in Storyblok
   ("Settings" -> "Visual Editor"). Type in the base URL of your deployment and
   add `/preview/` as the path, e.g.
   `https://energyui-storyblok-starter.vercel.app/preview/`.

See ["Local Development"-Section](#local-development) below for the necessary steps to start developing locally with rapid feedback cycles.

You can use this button to deploy the EnergyUI@Storyblok starter repo on Vercel. Feel free to change the repository URL for quicker deployment of the clone repository:

## Deploy your own

### Requirements

- Node / `npm`: Ensure you're using the correct Node version 18+ locally; `nvs use`, `nvm use` for automatic selection, if you use one of those tools.
- [`mkcert`](https://github.com/FiloSottile/mkcert#installation): for local setup, to get a locally trusted SSL certificate... needed to run inside the Visual Editor iframe of `app.storyblok.com`

### Manually

#### Setup

1. Create a new Storyblok Space to host your project (you can just go with the free "Community" tier here, to start): https://app.storyblok.com/#/me/spaces/new
2. TODO note about initial video uploads needing account / space verification for it to work, only needed for premium, though. General note applies to both, though
3. Fork the starter to your own account or organisation, this way you can easily benefit from future improvements: https://github.com/kickstartDS/storyblok-starter/fork
4. Clone the forked repository to your local machine
5. Switch to the freshly cloned directory, and inside:
   1. `npm i` to install dependencies
   2. Copy `.env.local.sample` to `.env.local`, and replace all placeholders:
      - You can find the Space ID (`NEXT_STORYBLOK_SPACE_ID`) in your Storyblok Spaces "Settings", on the initially opened page (called "Space"). Make sure to exclude(!) the `#` sign in front of it (`297364` instead of `#297364`)
      - You can find the needed Preview API Token (`NEXT_STORYBLOK_API_TOKEN`) in those same "Settings", but in the sub page called "Access Tokens". You can just use the initially created `Preview`-Token (just copy it using the handy icon)
      - Your Management API OAUTH Token (`NEXT_STORYBLOK_OAUTH_TOKEN`) needs to be created in your "My account" settings, just follow this guide: https://www.storyblok.com/docs/api/management/getting-started/authentication
   3. (Re-)login to the Storyblok CLI: `npm run storyblok-logout` followed by `npm run storyblok-logout`. The logout first ensures the CLI can actually see all projects, especially newly created ones (which would be likely for a starter like this) can error out otherwise. Use your Storyblok-Login and the region chosen when creating your Space here
   4. Run the project initialization: `npm run init`. This removes demo content, adds all the needed preset and demo content images (into distinct folders, as not to pollute your future project), all components and preset configuration, and creates an initial demo page
   5. Final small adjustment you need to make is to add your future site url in `.env` (variable `NEXT_PUBLIC_SITE_URL`)
   6. You can now commit & push all the locally updated files (`git add --all && git commit -m "Initial Storyblok setup" && git push remote origin`):
      - `cms/components.123456.json` is the automatically generated component schema, which was already part of the repository when forked (you can regenerate it with `npm run create-storyblok-config`). It now includes the correct asset references for visual component previews
      - `cms/presets.123456.json` is the same for presets, now with updated asset references for visual preset previews and correct space and component id references
      - `types/components-schema.json` is your live component schema pulled from Storyblok (seeded by `cms/components.123456.json`, this now includes all correct ids and references, pulled by `npm run pull-content-schema`)
      - `types/components-presets.json` again is the same for presets
      - `types/components-schema.d.ts` includes TypeScript types matching your content and component schemas. This is generated based off your `components-schema.json` by using https://github.com/dohomi/storyblok-generate-ts
      - `.env` containing general project related configuration

#### Local

TODO add note somewhere about server start being bound to `getting-started` existing. If that page is renamed / deleted, you need to adjust the script `dev:proxy` in `package.json` accordingly.

1. Inside the project directory start by creating a local certificate for the project: `mkcert localhost`. This generates local key and cert files used when starting the local server (you don't commit those, which is why they're on the `.gitignore`)
2. Run a first full build with `npm run build`
3. Start the local server (including proxy) with `npm run dev`
4. Open your Space in Storyblok (https://app.storyblok.com)
5. Go into the projects "Settings", and open the entry "Visual Editor"
6. Add a new "Preview URL" called "Development", and set its value to `https://localhost:3010/api/preview/`
7. On the main "Content" pane, open the page "Getting Started", that was created on initial project setup
8. At the top of the window, inside the simulated address bar of the page preview, click on the small settings icon to the right... and select your "Development" Preview URL
9. Et voila... you should see your locally hosted page preview

TODO: check initial `npm run init` locally again... failed for `push-components` in initial try, because of missing environment variable `NEXT_STORYBLOK_SPACE_ID` in `push-components` script

### Netlify Deploy

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/kickstartDS/storyblok-starter)

## Local Development

### Dependencies

- [`mkcert`](https://github.com/FiloSottile/mkcert#installation)
- `npm` (unless you opt for devcontainer)

### Setup

#### TODO

- Favicon
- Fonts
- HTML lang
- (robots.txt)
- initial branding seems broken currently, at least for Premium Starter. Maybe a consequence of failed merges with Lughausen repository

### Adding initial content

#### Root page (your index page)

TODO

#### Global Settings (header, footer, seo)

TODO

#### 404

TODO

### Creating branded component and preset previews

`YOUR_WEBSITE` should be the path pointing to your website project, the one you want to update the previews for.

1. Clone the Design System this is based on locally: https://github.com/kickstartDS/ds-agency
2. Switch to the freshly cloned directory, and inside:
   1. `yarn` to install dependencies
   2. `rm -rf src/token` to remove the existing default theme
   3. `cp -r YOUR_WEBSITE/token src/token` to copy your Design Token / Style Dictionary configuration to the Design System project
   4. Adjust the `background-color` for the `.preview--wrapper` CSS class in `global.scss`, to a color suitable for your component screenshots (depends on your applied design)
   5. `yarn build-storybook` to build a Storybook that can then be used to create screenshots
   6. `yarn create-component-previews` to re-create the existing previews with your branding
   7. `mkdir -p YOUR_WEBSITE/public/img && rm -rf YOUR_WEBSITE/public/img/screenshots && cp -r static/img/screenshots YOUR_WEBSITE/public/img/` to copy the generated screenshots to your project
   8. `cd YOUR_WEBSITE` to switch to your website project
   9. `npm run update-previews` to update those newly created screenshots in your Storyblok space
3. That's it!

## Working with the content schema

### Typescript Support

Generate ts types according to the content schema by running
`NEXT_STORYBLOK_SPACE_ID=<your-space-id> npm run generate-content-types`.

### Migrations

When changing the content schema we recommend sticking to [Storyblok's Best
Practices](https://www.storyblok.com/tp/storyblok-cli-best-practices#modify-blok-structure).

## Contributing

Contributions are welcome. Unless you explicitly state otherwise, any contribution intentionally submitted for inclusion in the work by you, as defined in the Apache-2.0 license, shall be dual licensed as below, without any additional terms or conditions.

## License

This project is licensed under either of

- [Apache License, Version 2.0](https://www.apache.org/licenses/LICENSE-2.0) ([LICENSE-APACHE](LICENSE-APACHE))
- [MIT license](https://opensource.org/license/mit/) ([LICENSE-MIT](LICENSE-MIT))

at your option.

The SPDX license identifier for this project is MIT OR Apache-2.0.

---

For more information and updates, please visit the project's GitHub repository.

## Support

Join our [Discord community](https://discord.gg/mwKzD5gejY) for support, or leave an issue on this repository!
