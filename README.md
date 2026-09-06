<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project structure

```
.
├── eslint.config.mjs
├── nest-cli.json
├── package.json
├── prisma.config.ts
├── README.md
├── tsconfig.build.json
├── tsconfig.json
├── prisma
│   ├── schema.prisma
│   └── migrations
│       ├── migration_lock.toml
│       ├── 20260723164512_init
│       │   └── migration.sql
│       ├── 20260724132546_added_is_verified
│       │   └── migration.sql
│       └── 20260730165044_added_subcategory
│           └── migration.sql
├── src
│   ├── app.controller.spec.ts
│   ├── app.controller.ts
│   ├── app.module.ts
│   ├── app.service.ts
│   ├── main.ts
│   ├── prisma.service.ts
│   ├── transform.interceptor.ts
│   ├── common
│   │   ├── common.module.ts
│   │   ├── decorator
│   │   │   ├── public.decorator.ts
│   │   │   └── role.decorator.ts
│   │   ├── guard
│   │   │   ├── auth.guard.ts
│   │   │   └── role.guard.ts
│   │   ├── services
│   │   │   └── hashing.service.ts
│   │   └── utils
│   │       └── zod.utils.ts
│   ├── generated
│   │   └── prisma
│   │       ├── browser.ts
│   │       ├── client.ts
│   │       ├── commonInputTypes.ts
│   │       ├── enums.ts
│   │       ├── models.ts
│   │       ├── internal
│   │       │   ├── class.ts
│   │       │   ├── prismaNamespace.ts
│   │       │   └── prismaNamespaceBrowser.ts
│   │       └── models
│   │           ├── Cart.ts
│   │           ├── CartItem.ts
│   │           ├── Category.ts
│   │           ├── Order.ts
│   │           ├── OrderItem.ts
│   │           ├── Product.ts
│   │           ├── ProductReview.ts
│   │           ├── PromoCode.ts
│   │           ├── User.ts
│   │           └── UserAddress.ts
│   ├── mail
│   │   ├── mail.module.ts
│   │   ├── mail.service.spec.ts
│   │   ├── mail.service.ts
│   │   └── templates
│   │       └── verify-email.hbs
│   ├── modules
│   │   ├── auth
│   │   │   ├── auth.controller.spec.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.service.spec.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── dto
│   │   │   │   ├── create-user.dto.ts
│   │   │   │   └── login-user.dto.ts
│   │   │   ├── interfaces
│   │   │   │   ├── access-token.interface.ts
│   │   │   │   └── temp-user.interface.ts
│   │   │   └── util
│   │   ├── categories
│   │   │   ├── categories.controller.spec.ts
│   │   │   ├── categories.controller.ts
│   │   │   ├── categories.module.ts
│   │   │   ├── categories.service.spec.ts
│   │   │   ├── categories.service.ts
│   │   │   └── dto
│   │   ├── products
│   │   │   ├── products.controller.spec.ts
│   │   │   ├── products.controller.ts
│   │   │   ├── products.module.ts
│   │   │   ├── products.service.spec.ts
│   │   │   ├── products.service.ts
│   │   │   └── dto
│   │   ├── uploads
│   │   │   ├── constants.ts
│   │   │   ├── uploads.controller.spec.ts
│   │   │   ├── uploads.controller.ts
│   │   │   ├── uploads.module.ts
│   │   │   ├── uploads.service.spec.ts
│   │   │   ├── uploads.service.ts
│   │   │   ├── dto
│   │   │   └── storage
│   │   └── user
│   │       ├── user.controller.spec.ts
│   │       ├── user.controller.ts
│   │       ├── user.module.ts
│   │       ├── user.service.spec.ts
│   │       ├── user.service.ts
│   │       └── dto
└── test
    ├── app.e2e-spec.ts
    └── jest-e2e.json
```

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
