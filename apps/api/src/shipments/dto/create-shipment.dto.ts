import { IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class CreateShipmentDto {
  @IsString()
  @IsNotEmpty({ message: 'La dirección de origen es requerida' })
  originAddress: string;

  @IsString()
  @IsNotEmpty({ message: 'La dirección de destino es requerida' })
  destinationAddress: string;

  @IsString()
  @IsNotEmpty({ message: 'El nombre del destinatario es requerido' })
  recipientName: string;

  @IsString()
  @IsOptional()
  contactPhone?: string;

  @IsNumber({}, { message: 'El peso debe ser un número' })
  @IsPositive({ message: 'El peso debe ser mayor a 0' })
  weightKg: number;
}
