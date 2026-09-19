import {
  type CreateCompany,
  type GetCompany,
  type ListCompanies,
  type UpdateCompany,
} from '@app/api-server-sdk';

import { authed, must, type HandlerContext } from './context.js';
import { type CompaniesService } from '../companies/service.js';

export function companyHandlers(companies: CompaniesService) {
  const ListCompaniesOp: ListCompanies<HandlerContext> = authed(async (_input, ctx) => ({
    items: await companies.list(ctx.user.id),
  }));

  const CreateCompanyOp: CreateCompany<HandlerContext> = authed(async (input, ctx) => ({
    company: await companies.create({
      name: must(input.name, 'name'),
      description: input.description,
      createdBy: ctx.user.id,
    }),
  }));

  const GetCompanyOp: GetCompany<HandlerContext> = authed(async (input, ctx) => ({
    company: await companies.get(must(input.companyId, 'companyId'), ctx.user.id),
  }));

  const UpdateCompanyOp: UpdateCompany<HandlerContext> = authed(async (input, ctx) => ({
    company: await companies.update(
      must(input.companyId, 'companyId'),
      { name: input.name, description: input.description },
      ctx.user.id,
    ),
  }));

  return {
    ListCompanies: ListCompaniesOp,
    CreateCompany: CreateCompanyOp,
    GetCompany: GetCompanyOp,
    UpdateCompany: UpdateCompanyOp,
  };
}
