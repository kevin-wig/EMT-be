import { NestApplication, NestFactory } from '@nestjs/core';
import { ValidationError, ValidationPipe } from '@nestjs/common';
import { SwaggerModule } from '@nestjs/swagger';
import { useContainer } from 'class-validator';
import { join } from 'path';

import { ValidationException } from './exceptions/validation.exception';
import { ValidationFilter } from './exceptions/validation.filter';
import { AppModule } from './modules/app/app.module';
import { SwaggerService } from './swagger/swagger.service';
import { SWAGGER_API_PATH } from './swagger/swagger.constants';
import { TrimBodyPipe } from './shared/dto-property.transformer';
import { errorMessagesFromValidator } from './shared/utils/error-messages-from-validator';

async function bootstrap() {
  const app = (await NestFactory.create(AppModule, {
    cors: true,
  })) as NestApplication;

  app.useStaticAssets(join(__dirname, '../upload'));

  const swagger = await app.resolve(SwaggerService);
  swagger.prepareSwaggerOptions();
  const document = SwaggerModule.createDocument(
    app,
    swagger.swaggerOptions.build(),
  );
  SwaggerModule.setup(SWAGGER_API_PATH, app, document);

  app.useGlobalFilters(new ValidationFilter());

  app.useGlobalPipes(
    new TrimBodyPipe(),
    new ValidationPipe({
      whitelist: true,
      validationError: { target: false },
      exceptionFactory: (errors: ValidationError[]) => {
        return new ValidationException(
          errors.reduce(errorMessagesFromValidator, {}),
        );
      },
    }),
  );

  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  await app.listen(process.env.PORT);
}

bootstrap();
