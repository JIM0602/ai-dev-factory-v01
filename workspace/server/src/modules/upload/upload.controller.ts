import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ApiTags, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';

/**
 * 文件上传控制器
 *
 * 商家上传门店照片。
 */
@ApiTags('Upload')
@Controller('upload')
export class UploadController {
  @Roles('merchant')
  @Post('image')
  @ApiOperation({ summary: '上传门店照片' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadDir = process.env.UPLOAD_DIR || join(process.cwd(), 'uploads');
          const dateDir = new Date().toISOString().slice(0, 7).replace('-', '/');
          const fullPath = join(uploadDir, dateDir);
          // 确保目录存在（由 multer 或预先创建）
          cb(null, fullPath);
        },
        filename: (req, file, cb) => {
          const uniqueName = uuidv4();
          const ext = extname(file.originalname).toLowerCase();
          cb(null, `${uniqueName}${ext}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedMimes.includes(file.mimetype)) {
          cb(new BadRequestException({
            code: 20002,
            message: '仅支持 jpg/png/webp 格式的图片',
            data: null,
          }), false);
          return;
        }
        cb(null, true);
      },
      limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE || '2097152', 10), // 默认 2MB
      },
    }),
  )
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException({
        code: 20001,
        message: '请选择要上传的文件',
        data: null,
      });
    }

    // 构建访问 URL
    const url = `/uploads/${new Date().toISOString().slice(0, 7).replace('-', '/')}/${file.filename}`;

    return { url };
  }
}
