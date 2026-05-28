import { Controller, Get, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Dashboard admin' })
  getDashboard() {
    return this.adminService.getDashboard();
  }

  @Get('users')
  @ApiOperation({ summary: 'Liste des utilisateurs' })
  getUsers() {
    return this.adminService.getUsers();
  }

  @Put('users/:id/role')
  @ApiOperation({ summary: 'Modifier le rôle d\'un utilisateur' })
  updateUserRole(@Param('id') id: string, @Body('role') role: string) {
    return this.adminService.updateUserRole(id, role);
  }

  @Delete('users/:id')
  @ApiOperation({ summary: 'Supprimer un utilisateur (admin uniquement)' })
  deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }

  @Get('commissions')
  @ApiOperation({ summary: 'Rapport des commissions' })
  getCommissionReport() {
    return this.adminService.getCommissionReport();
  }
}
