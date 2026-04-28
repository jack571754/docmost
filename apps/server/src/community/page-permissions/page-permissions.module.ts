import { Module } from '@nestjs/common';
import { PagePermissionsController } from './page-permissions.controller';
import { PagePermissionsService } from './page-permissions.service';
import { CaslModule } from '../../core/casl/casl.module';
import { PageAccessModule } from '../../core/page/page-access/page-access.module';

@Module({
  imports: [CaslModule, PageAccessModule],
  controllers: [PagePermissionsController],
  providers: [PagePermissionsService],
})
export class PagePermissionsModule {}
