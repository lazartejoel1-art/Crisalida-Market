import { Controller, Get, Post } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post('visita')
  registrar() {
    return this.analyticsService.registrarVisita();
  }

  @Get('total')
  total() {
    return this.analyticsService.totalVisitas();
  }

  @Get('summary')
  async summary() {
    const total = await this.analyticsService.totalVisitas();

    return {
      totalVisits: total,
      uniqueIps: total,
      visitsToday: total,
      last7Days: [
        {
          date: new Date().toISOString().slice(0, 10),
          visits: total,
        },
      ],
    };
  }
}
