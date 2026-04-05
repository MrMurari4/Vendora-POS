import 'dotenv/config'; 
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Notice the lowercase 's' in Cors
  app.enableCors(); 

  await app.listen(3000);
  
  // Change .url() to .getUrl()
  console.log(`🚀 Application is running on: ${await app.getUrl()}`);
}
bootstrap();