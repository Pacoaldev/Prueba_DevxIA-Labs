import { ArrayMinSize, IsArray, IsNotEmpty, IsNumber, IsPositive, IsString } from 'class-validator';

export class AssignVehiclesDto {
  @IsArray({ message: 'shipmentIds debe ser un arreglo de identificadores' })
  @ArrayMinSize(1, { message: 'Debe ingresar al menos un identificador de envío' })
  @IsString({ each: true })
  shipmentIds: string[];

  @IsNumber({}, { message: 'vehicleCapacity debe ser un número' })
  @IsPositive({ message: 'La capacidad del vehículo debe ser mayor a 0' })
  @IsNotEmpty({ message: 'vehicleCapacity es requerido' })
  vehicleCapacity: number;
}
