import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { ShipmentStatus } from '@prisma/client';

export class UpdateShipmentStatusDto {
  @IsEnum(ShipmentStatus, { message: 'El estado especificado no es válido' })
  @IsNotEmpty({ message: 'El nuevo estado es requerido' })
  status: ShipmentStatus;

  @IsString()
  @IsNotEmpty({ message: 'La ubicación es requerida' })
  location: string;

  @IsString()
  @IsNotEmpty({ message: 'Las notas del evento son requeridas' })
  notes: string;
}
