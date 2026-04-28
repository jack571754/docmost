import { Module } from '@nestjs/common';
import { PagePermissionsModule } from './page-permissions/page-permissions.module';

@Module({
  imports: [PagePermissionsModule],
})
export class CommunityModule {}
