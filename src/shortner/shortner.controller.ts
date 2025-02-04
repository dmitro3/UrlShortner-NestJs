import { Controller, Get, Param, Query, Req, Res } from '@nestjs/common';
import { ShortnerService } from './shortner.service';

@Controller('/')
export class ShortnerController {
  constructor(private readonly shortnerService: ShortnerService) {}

  @Get(':id')
  async getLink(
    @Param('id') id: string,
    @Query('ref') ref = 'direct',
    @Req() req,
    @Res() res,
  ) {
    const userAgent = req.headers['user-agent'] || '';
    const ip =
      req.headers['cf-connecting-ip'] ||
      req.headers['x-real-ip'] ||
      req.headers['x-forwarded-for'] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress;
    const url = await this.shortnerService.getShortURL(id, ip, userAgent);
    if (url) {
      res.redirect(url);
    } else {
      res.setHeader('Cache-Control', 'no-store');
      return res.sendStatus(404);
    }
  }
}
