import { mutationGeneric,queryGeneric,type DataModelFromSchemaDefinition,type GenericMutationCtx,type GenericQueryCtx,type MutationBuilder,type QueryBuilder } from 'convex/server';
import type schema from './schema';
export type DataModel=DataModelFromSchemaDefinition<typeof schema>;
export type QueryContext=GenericQueryCtx<DataModel>;
export type MutationContext=GenericMutationCtx<DataModel>;
export const query:QueryBuilder<DataModel,'public'>=queryGeneric;
export const mutation:MutationBuilder<DataModel,'public'>=mutationGeneric;
