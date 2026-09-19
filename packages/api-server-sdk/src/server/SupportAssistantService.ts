// smithy-typescript generated code
import { HttpRequest as __HttpRequest, HttpResponse as __HttpResponse } from "@smithy/core/protocols";
import { fromBase64, fromUtf8, toBase64, toUtf8 } from "@smithy/core/serde";
import { NodeHttpHandler, streamCollector } from "@smithy/node-http-handler";
import {
  AuthScheme as __AuthScheme,
  Caller as __Caller,
  ExecutionHook as __ExecutionHook,
  FrameworkSteps as __FrameworkSteps,
  generateValidationMessage as __generateValidationMessage,
  generateValidationSummary as __generateValidationSummary,
  httpbinding,
  InternalFailureException as __InternalFailureException,
  isFrameworkException as __isFrameworkException,
  Mux as __Mux,
  Operation as __Operation,
  OperationSerializer as __OperationSerializer,
  recordSafely as __recordSafely,
  recordTimed as __recordTimed,
  recordTimedSync as __recordTimedSync,
  SerializationException as __SerializationException,
  ServerInterceptor as __ServerInterceptor,
  ServerSerdeContext as __ServerSerdeContext,
  ServiceException as __ServiceException,
  ServiceHandler as __ServiceHandler,
  SmithyFrameworkException as __SmithyFrameworkException,
  UnauthenticatedException as __UnauthenticatedException,
  UnknownOperationException as __UnknownOperationException,
  ValidationCustomizer as __ValidationCustomizer,
  ValidationFailure as __ValidationFailure,
} from "@smithy/server-common";
import {
  MetricsRecorder as __MetricsRecorder,
  MetricsRecorderFactory as __MetricsRecorderFactory,
} from "@smithy/types";

import { serializeFrameworkException } from "../protocols/Aws_restJson1";
import {
  ActivateGuidelineVersion,
  ActivateGuidelineVersionSerializer,
  ActivateGuidelineVersionServerInput,
} from "./operations/ActivateGuidelineVersion";
import { CreateCompany, CreateCompanySerializer, CreateCompanyServerInput } from "./operations/CreateCompany";
import {
  CreateConversation,
  CreateConversationSerializer,
  CreateConversationServerInput,
} from "./operations/CreateConversation";
import {
  GetActiveGuidelines,
  GetActiveGuidelinesSerializer,
  GetActiveGuidelinesServerInput,
} from "./operations/GetActiveGuidelines";
import { GetCompany, GetCompanySerializer, GetCompanyServerInput } from "./operations/GetCompany";
import { GetConversation, GetConversationSerializer, GetConversationServerInput } from "./operations/GetConversation";
import { GetCurrentUser, GetCurrentUserSerializer, GetCurrentUserServerInput } from "./operations/GetCurrentUser";
import {
  GetGuidelineVersion,
  GetGuidelineVersionSerializer,
  GetGuidelineVersionServerInput,
} from "./operations/GetGuidelineVersion";
import { Health, HealthSerializer, HealthServerInput } from "./operations/Health";
import { ListCompanies, ListCompaniesSerializer, ListCompaniesServerInput } from "./operations/ListCompanies";
import {
  ListConversations,
  ListConversationsSerializer,
  ListConversationsServerInput,
} from "./operations/ListConversations";
import { ListCorrections, ListCorrectionsSerializer, ListCorrectionsServerInput } from "./operations/ListCorrections";
import {
  ListGuidelineVersions,
  ListGuidelineVersionsSerializer,
  ListGuidelineVersionsServerInput,
} from "./operations/ListGuidelineVersions";
import { Login, LoginSerializer, LoginServerInput } from "./operations/Login";
import { Logout, LogoutSerializer, LogoutServerInput } from "./operations/Logout";
import { RefreshToken, RefreshTokenSerializer, RefreshTokenServerInput } from "./operations/RefreshToken";
import {
  RetryGuidelineVersion,
  RetryGuidelineVersionSerializer,
  RetryGuidelineVersionServerInput,
} from "./operations/RetryGuidelineVersion";
import { SendMessage, SendMessageSerializer, SendMessageServerInput } from "./operations/SendMessage";
import { SubmitFeedback, SubmitFeedbackSerializer, SubmitFeedbackServerInput } from "./operations/SubmitFeedback";
import { UpdateCompany, UpdateCompanySerializer, UpdateCompanyServerInput } from "./operations/UpdateCompany";
import {
  UpdateCorrection,
  UpdateCorrectionSerializer,
  UpdateCorrectionServerInput,
} from "./operations/UpdateCorrection";
import {
  UploadGuidelines,
  UploadGuidelinesSerializer,
  UploadGuidelinesServerInput,
} from "./operations/UploadGuidelines";

export type SupportAssistantServiceOperations = "ActivateGuidelineVersion" | "CreateCompany" | "CreateConversation" | "GetActiveGuidelines" | "GetCompany" | "GetConversation" | "GetCurrentUser" | "GetGuidelineVersion" | "Health" | "ListCompanies" | "ListConversations" | "ListCorrections" | "ListGuidelineVersions" | "Login" | "Logout" | "RefreshToken" | "RetryGuidelineVersion" | "SendMessage" | "SubmitFeedback" | "UpdateCompany" | "UpdateCorrection" | "UploadGuidelines";
export interface SupportAssistantService<Context> {
  ActivateGuidelineVersion: ActivateGuidelineVersion<Context>
  CreateCompany: CreateCompany<Context>
  CreateConversation: CreateConversation<Context>
  GetActiveGuidelines: GetActiveGuidelines<Context>
  GetCompany: GetCompany<Context>
  GetConversation: GetConversation<Context>
  GetCurrentUser: GetCurrentUser<Context>
  GetGuidelineVersion: GetGuidelineVersion<Context>
  Health: Health<Context>
  ListCompanies: ListCompanies<Context>
  ListConversations: ListConversations<Context>
  ListCorrections: ListCorrections<Context>
  ListGuidelineVersions: ListGuidelineVersions<Context>
  Login: Login<Context>
  Logout: Logout<Context>
  RefreshToken: RefreshToken<Context>
  RetryGuidelineVersion: RetryGuidelineVersion<Context>
  SendMessage: SendMessage<Context>
  SubmitFeedback: SubmitFeedback<Context>
  UpdateCompany: UpdateCompany<Context>
  UpdateCorrection: UpdateCorrection<Context>
  UploadGuidelines: UploadGuidelines<Context>
}
const serdeContextBase = {
  base64Encoder: toBase64,
  base64Decoder: fromBase64,
  utf8Encoder: toUtf8,
  utf8Decoder: fromUtf8,
  streamCollector: streamCollector,
  requestHandler: new NodeHttpHandler(),
  disableHostPrefix: true
};
const SupportAssistantServiceHandlerValidators: { [K in SupportAssistantServiceOperations]: (input: any) => __ValidationFailure[] } = {
  "ActivateGuidelineVersion": ActivateGuidelineVersionServerInput.validate,
  "CreateCompany": CreateCompanyServerInput.validate,
  "CreateConversation": CreateConversationServerInput.validate,
  "GetActiveGuidelines": GetActiveGuidelinesServerInput.validate,
  "GetCompany": GetCompanyServerInput.validate,
  "GetConversation": GetConversationServerInput.validate,
  "GetCurrentUser": GetCurrentUserServerInput.validate,
  "GetGuidelineVersion": GetGuidelineVersionServerInput.validate,
  "Health": HealthServerInput.validate,
  "ListCompanies": ListCompaniesServerInput.validate,
  "ListConversations": ListConversationsServerInput.validate,
  "ListCorrections": ListCorrectionsServerInput.validate,
  "ListGuidelineVersions": ListGuidelineVersionsServerInput.validate,
  "Login": LoginServerInput.validate,
  "Logout": LogoutServerInput.validate,
  "RefreshToken": RefreshTokenServerInput.validate,
  "RetryGuidelineVersion": RetryGuidelineVersionServerInput.validate,
  "SendMessage": SendMessageServerInput.validate,
  "SubmitFeedback": SubmitFeedbackServerInput.validate,
  "UpdateCompany": UpdateCompanyServerInput.validate,
  "UpdateCorrection": UpdateCorrectionServerInput.validate,
  "UploadGuidelines": UploadGuidelinesServerInput.validate,
};
export class SupportAssistantServiceHandler<Context> implements __ServiceHandler<Context> {
  private readonly mux: __Mux<"SupportAssistant", SupportAssistantServiceOperations>;
  private readonly service: SupportAssistantService<Context>;
  private readonly serializerFactory: <T extends SupportAssistantServiceOperations>(op: T) => __OperationSerializer<SupportAssistantService<Context>, T, __ServiceException>;
  private readonly serializeFrameworkException: (e: __SmithyFrameworkException, ctx: __ServerSerdeContext) => Promise<__HttpResponse>;
  private readonly validationCustomizer: __ValidationCustomizer<SupportAssistantServiceOperations>;
  private readonly interceptors: __ServerInterceptor<Context>[] = [];
  private readonly authSchemes: __AuthScheme<Context>[] = [];
  private metricsRecorderFactory?: __MetricsRecorderFactory<any>;
  /**
   * Construct a SupportAssistantService handler.
   * @param service The {@link SupportAssistantService} implementation that supplies the business logic for SupportAssistantService
   * @param mux The {@link __Mux} that determines which service and operation are being invoked by a given {@link __HttpRequest}
   * @param serializerFactory A factory for an {@link __OperationSerializer} for each operation in SupportAssistantService that
   *                          handles deserialization of requests and serialization of responses
   * @param serializeFrameworkException A function that can serialize {@link __SmithyFrameworkException}s
   * @param validationCustomizer A {@link __ValidationCustomizer} for turning validation failures into {@link __SmithyFrameworkException}s
   */
  constructor(
    service: SupportAssistantService<Context>,
    mux: __Mux<"SupportAssistant", SupportAssistantServiceOperations>,
    serializerFactory:<T extends SupportAssistantServiceOperations>(op: T) => __OperationSerializer<SupportAssistantService<Context>, T, __ServiceException>,
    serializeFrameworkException: (e: __SmithyFrameworkException, ctx: __ServerSerdeContext) => Promise<__HttpResponse>,
    validationCustomizer: __ValidationCustomizer<SupportAssistantServiceOperations>
  ) {
    this.service = service;
    this.mux = mux;
    this.serializerFactory = serializerFactory;
    this.serializeFrameworkException = serializeFrameworkException;
    this.validationCustomizer = validationCustomizer;
  }
  withMetrics<Native>(metricsRecorderFactory: __MetricsRecorderFactory<Native>): this {
    this.metricsRecorderFactory = metricsRecorderFactory;
    return this;
  }
  withAuth(...schemes: __AuthScheme<Context>[]): this {
    this.authSchemes.push(...schemes);
    return this;
  }
  addInterceptor(interceptor: __ServerInterceptor<Context>): this {
    this.interceptors.unshift(interceptor);
    return this;
  }
  addInterceptors(...interceptors: __ServerInterceptor<Context>[]): this {
    this.interceptors.unshift(...[...interceptors].reverse());
    return this;
  }
  async handle(request: __HttpRequest, context: Context): Promise<__HttpResponse> {
    const recorder: __MetricsRecorder<any> | undefined = this.metricsRecorderFactory?.create();
    const safeRecord = (fn: (recorder: __MetricsRecorder<any>) => void): void => __recordSafely(recorder, fn);
    const timed = <T>(name: string, fn: () => Promise<T>): Promise<T> => __recordTimed(recorder, name, fn);
    const timedSync = <T>(name: string, fn: () => T): T => __recordTimedSync(recorder, name, fn);

    const steps: __FrameworkSteps<Context> = {
      route: (request) => this.mux.match(request)?.operation,
      deserialize: (operation, request) => timed("DeserializationTime", async () => {
        try {
          return await this.serializerFactory(operation as SupportAssistantServiceOperations).deserialize(request, { endpoint: () => Promise.resolve(request), ...serdeContextBase });
        } catch (error: unknown) {
          if (__isFrameworkException(error)) {
            throw error;
          }
          throw new __SerializationException();
        }
      }),
      validate: (operation, input) => timedSync("ValidationTime", () => {
        const validationFailures = SupportAssistantServiceHandlerValidators[operation as SupportAssistantServiceOperations](input);
        if (validationFailures && validationFailures.length > 0) {
          const validationException = this.validationCustomizer({ operation: operation as SupportAssistantServiceOperations }, validationFailures);
          if (validationException) {
            throw validationException;
          }
        }
      }),
      invoke: (operation, input, context) => timed("ActivityTime", () => (this.service[operation as SupportAssistantServiceOperations] as any)(input, context)),
      serialize: (operation, output) => timed("SerializationTime", () => this.serializerFactory(operation as SupportAssistantServiceOperations).serialize(output as any, serdeContextBase)),
      serializeError: (operation, error) => {
        if (operation === undefined) {
          return undefined;
        }
        const serializer = this.serializerFactory(operation as SupportAssistantServiceOperations);
        return serializer.isOperationError(error) ? serializer.serializeError(error, serdeContextBase) : undefined;
      },
      serializeFrameworkException: (e) => this.serializeFrameworkException(e, serdeContextBase),
    };

    let metricsErrorClass: "Error" | "Fault" | "Failure" | undefined;
    const convertError = (op: string | undefined, caught: unknown): Promise<__HttpResponse> => {
      const modeled = steps.serializeError(op, caught);
      if (modeled) {
        metricsErrorClass = "Error";
        return modeled;
      }
      if (__isFrameworkException(caught)) {
        metricsErrorClass = "Fault";
        return steps.serializeFrameworkException(caught);
      }
      metricsErrorClass = "Failure";
      return steps.serializeFrameworkException(new __InternalFailureException());
    };

    const base = { request, context };
    let operation: string | undefined;
    let input: unknown;
    let output: unknown;
    let response: __HttpResponse | undefined;
    let caller: __Caller | undefined;
    let error: unknown;

    const entered = new Set<__ServerInterceptor<Context>>();

    safeRecord((r) => r.begin());
    // TODO: expose metricsRecorder via a typed server context instead of casting.
    (context as { metricsRecorder?: __MetricsRecorder<any> }).metricsRecorder = recorder;
    const __metricsStart = performance.now();

    const runPipeline = async (): Promise<__HttpResponse> => {
      try {
        for (const interceptor of this.interceptors) {
          if (interceptor.readBeforeExecution) {
            interceptor.readBeforeExecution(base);
          }
          entered.add(interceptor);
        }

        let authScheme: string | undefined;
        if (this.authSchemes.length > 0) {
          for (const scheme of this.authSchemes) {
            const result = await scheme.authenticate(request, context);
            if (result) {
              caller = result;
              authScheme = scheme.name;
              break;
            }
          }
          if (!caller) {
            throw new __UnauthenticatedException();
          }
          this.fireRead("readAfterAuthentication", () => ({ ...base, authScheme: authScheme!, caller: caller! }));
        }

        const req = this.fireModify<__HttpRequest, typeof base>("modifyBeforeDeserialization", request, (r) => ({ ...base, request: r }));

        operation = steps.route(req);
        if (!operation) {
          throw new __UnknownOperationException();
        }

        input = await steps.deserialize(operation, req);
        const inputHook = () => ({ ...base, operation: operation!, input });
        this.fireRead("readAfterDeserialization", inputHook);
        input = this.fireModify("modifyBeforeValidation", input, (v) => ({ ...base, operation: operation!, input: v }));
        steps.validate(operation, input);
        this.fireRead("readAfterValidation", inputHook);
        this.fireRead("readBeforeInvocation", inputHook);
        output = await steps.invoke(operation, input, context);
        this.fireRead("readAfterInvocation", () => ({ ...base, operation: operation!, input, output }));
        output = this.fireModify("modifyBeforeSerialization", output, (v) => ({ ...base, operation: operation!, input, output: v }));
        response = await steps.serialize(operation, output);
        this.fireRead("readAfterSerialization", () => ({ ...base, operation: operation!, input, output, response: response! }));
      } catch (caught: unknown) {
        error = caught;
        response = await convertError(operation, caught);
      }

      try {
        response = this.fireModify("modifyBeforeCompletion", response!, (v) => ({ ...base, operation: operation!, input, output, response: v }));
      } catch (caught: unknown) {
        error = caught;
        response = await convertError(operation, caught);
      }

      const execHook: __ExecutionHook<Context> = { request, context, operation, input, output, response, error };
      for (const interceptor of this.interceptors) {
        if (entered.has(interceptor) && interceptor.readAfterExecution) {
          try {
            interceptor.readAfterExecution(execHook);
          } catch (e) {
            // readAfterExecution is best-effort and must not mask the response; ignore hook failures.
          }
        }
      }

      return response!;
    };

    try {
      return await runPipeline();
    } finally {
      if (operation) {
        safeRecord((r) => r.setProperty("Operation", operation!));
      }
      safeRecord((r) => r.recordRequestOutcome(error === undefined ? "Success" : "Fault", performance.now() - __metricsStart));
      safeRecord((r) => r.addCount("Error", metricsErrorClass === "Error" ? 1 : 0));
      safeRecord((r) => r.addCount("Fault", metricsErrorClass === "Fault" || metricsErrorClass === "Failure" ? 1 : 0));
      safeRecord((r) => r.addCount("Failure", metricsErrorClass === "Failure" ? 1 : 0));
      safeRecord((r) => r.end());
    }
  }
  private fireRead<H>(method: keyof __ServerInterceptor<Context>, buildHook: () => H): void {
    for (const interceptor of this.interceptors) {
      const fn = interceptor[method] as ((hook: H) => void) | undefined;
      if (fn) {
        fn.call(interceptor, buildHook());
      }
    }
  }
  private fireModify<V, H>(method: keyof __ServerInterceptor<Context>, initial: V, buildHook: (current: V) => H): V {
    let current = initial;
    for (const interceptor of this.interceptors) {
      const fn = interceptor[method] as ((hook: H) => V) | undefined;
      if (fn) {
        current = fn.call(interceptor, buildHook(current));
      }
    }
    return current;
  }
}

export const getSupportAssistantServiceHandler = <Context>(service: SupportAssistantService<Context>): __ServiceHandler<Context, __HttpRequest, __HttpResponse> => {
  const mux = new httpbinding.HttpBindingMux<"SupportAssistant", keyof SupportAssistantService<Context>>([
    new httpbinding.UriSpec<"SupportAssistant", "ActivateGuidelineVersion">(
      'POST',
      [
        { type: 'path_literal', value: "api" },
        { type: 'path_literal', value: "guideline-versions" },
        { type: 'path' },
        { type: 'path_literal', value: "activate" },
      ],
      [
      ],
      { service: "SupportAssistant", operation: "ActivateGuidelineVersion" }),
    new httpbinding.UriSpec<"SupportAssistant", "CreateCompany">(
      'POST',
      [
        { type: 'path_literal', value: "api" },
        { type: 'path_literal', value: "companies" },
      ],
      [
      ],
      { service: "SupportAssistant", operation: "CreateCompany" }),
    new httpbinding.UriSpec<"SupportAssistant", "CreateConversation">(
      'POST',
      [
        { type: 'path_literal', value: "api" },
        { type: 'path_literal', value: "conversations" },
      ],
      [
      ],
      { service: "SupportAssistant", operation: "CreateConversation" }),
    new httpbinding.UriSpec<"SupportAssistant", "GetActiveGuidelines">(
      'GET',
      [
        { type: 'path_literal', value: "api" },
        { type: 'path_literal', value: "companies" },
        { type: 'path' },
        { type: 'path_literal', value: "guidelines" },
      ],
      [
      ],
      { service: "SupportAssistant", operation: "GetActiveGuidelines" }),
    new httpbinding.UriSpec<"SupportAssistant", "GetCompany">(
      'GET',
      [
        { type: 'path_literal', value: "api" },
        { type: 'path_literal', value: "companies" },
        { type: 'path' },
      ],
      [
      ],
      { service: "SupportAssistant", operation: "GetCompany" }),
    new httpbinding.UriSpec<"SupportAssistant", "GetConversation">(
      'GET',
      [
        { type: 'path_literal', value: "api" },
        { type: 'path_literal', value: "conversations" },
        { type: 'path' },
      ],
      [
      ],
      { service: "SupportAssistant", operation: "GetConversation" }),
    new httpbinding.UriSpec<"SupportAssistant", "GetCurrentUser">(
      'GET',
      [
        { type: 'path_literal', value: "api" },
        { type: 'path_literal', value: "auth" },
        { type: 'path_literal', value: "me" },
      ],
      [
      ],
      { service: "SupportAssistant", operation: "GetCurrentUser" }),
    new httpbinding.UriSpec<"SupportAssistant", "GetGuidelineVersion">(
      'GET',
      [
        { type: 'path_literal', value: "api" },
        { type: 'path_literal', value: "guideline-versions" },
        { type: 'path' },
      ],
      [
      ],
      { service: "SupportAssistant", operation: "GetGuidelineVersion" }),
    new httpbinding.UriSpec<"SupportAssistant", "Health">(
      'GET',
      [
        { type: 'path_literal', value: "api" },
        { type: 'path_literal', value: "health" },
      ],
      [
      ],
      { service: "SupportAssistant", operation: "Health" }),
    new httpbinding.UriSpec<"SupportAssistant", "ListCompanies">(
      'GET',
      [
        { type: 'path_literal', value: "api" },
        { type: 'path_literal', value: "companies" },
      ],
      [
      ],
      { service: "SupportAssistant", operation: "ListCompanies" }),
    new httpbinding.UriSpec<"SupportAssistant", "ListConversations">(
      'GET',
      [
        { type: 'path_literal', value: "api" },
        { type: 'path_literal', value: "conversations" },
      ],
      [
      ],
      { service: "SupportAssistant", operation: "ListConversations" }),
    new httpbinding.UriSpec<"SupportAssistant", "ListCorrections">(
      'GET',
      [
        { type: 'path_literal', value: "api" },
        { type: 'path_literal', value: "companies" },
        { type: 'path' },
        { type: 'path_literal', value: "corrections" },
      ],
      [
      ],
      { service: "SupportAssistant", operation: "ListCorrections" }),
    new httpbinding.UriSpec<"SupportAssistant", "ListGuidelineVersions">(
      'GET',
      [
        { type: 'path_literal', value: "api" },
        { type: 'path_literal', value: "companies" },
        { type: 'path' },
        { type: 'path_literal', value: "guidelines" },
        { type: 'path_literal', value: "versions" },
      ],
      [
      ],
      { service: "SupportAssistant", operation: "ListGuidelineVersions" }),
    new httpbinding.UriSpec<"SupportAssistant", "Login">(
      'POST',
      [
        { type: 'path_literal', value: "api" },
        { type: 'path_literal', value: "auth" },
        { type: 'path_literal', value: "login" },
      ],
      [
      ],
      { service: "SupportAssistant", operation: "Login" }),
    new httpbinding.UriSpec<"SupportAssistant", "Logout">(
      'POST',
      [
        { type: 'path_literal', value: "api" },
        { type: 'path_literal', value: "auth" },
        { type: 'path_literal', value: "logout" },
      ],
      [
      ],
      { service: "SupportAssistant", operation: "Logout" }),
    new httpbinding.UriSpec<"SupportAssistant", "RefreshToken">(
      'POST',
      [
        { type: 'path_literal', value: "api" },
        { type: 'path_literal', value: "auth" },
        { type: 'path_literal', value: "refresh" },
      ],
      [
      ],
      { service: "SupportAssistant", operation: "RefreshToken" }),
    new httpbinding.UriSpec<"SupportAssistant", "RetryGuidelineVersion">(
      'POST',
      [
        { type: 'path_literal', value: "api" },
        { type: 'path_literal', value: "guideline-versions" },
        { type: 'path' },
        { type: 'path_literal', value: "retry" },
      ],
      [
      ],
      { service: "SupportAssistant", operation: "RetryGuidelineVersion" }),
    new httpbinding.UriSpec<"SupportAssistant", "SendMessage">(
      'POST',
      [
        { type: 'path_literal', value: "api" },
        { type: 'path_literal', value: "conversations" },
        { type: 'path' },
        { type: 'path_literal', value: "messages" },
      ],
      [
      ],
      { service: "SupportAssistant", operation: "SendMessage" }),
    new httpbinding.UriSpec<"SupportAssistant", "SubmitFeedback">(
      'PUT',
      [
        { type: 'path_literal', value: "api" },
        { type: 'path_literal', value: "messages" },
        { type: 'path' },
        { type: 'path_literal', value: "feedback" },
      ],
      [
      ],
      { service: "SupportAssistant", operation: "SubmitFeedback" }),
    new httpbinding.UriSpec<"SupportAssistant", "UpdateCompany">(
      'PATCH',
      [
        { type: 'path_literal', value: "api" },
        { type: 'path_literal', value: "companies" },
        { type: 'path' },
      ],
      [
      ],
      { service: "SupportAssistant", operation: "UpdateCompany" }),
    new httpbinding.UriSpec<"SupportAssistant", "UpdateCorrection">(
      'PATCH',
      [
        { type: 'path_literal', value: "api" },
        { type: 'path_literal', value: "corrections" },
        { type: 'path' },
      ],
      [
      ],
      { service: "SupportAssistant", operation: "UpdateCorrection" }),
    new httpbinding.UriSpec<"SupportAssistant", "UploadGuidelines">(
      'PUT',
      [
        { type: 'path_literal', value: "api" },
        { type: 'path_literal', value: "companies" },
        { type: 'path' },
        { type: 'path_literal', value: "guidelines" },
      ],
      [
      ],
      { service: "SupportAssistant", operation: "UploadGuidelines" }),
  ]);
  const serFn: (op: SupportAssistantServiceOperations) => __OperationSerializer<SupportAssistantService<Context>, SupportAssistantServiceOperations, __ServiceException> = (op) => {
    switch (op) {
      case "ActivateGuidelineVersion": return new ActivateGuidelineVersionSerializer();
      case "CreateCompany": return new CreateCompanySerializer();
      case "CreateConversation": return new CreateConversationSerializer();
      case "GetActiveGuidelines": return new GetActiveGuidelinesSerializer();
      case "GetCompany": return new GetCompanySerializer();
      case "GetConversation": return new GetConversationSerializer();
      case "GetCurrentUser": return new GetCurrentUserSerializer();
      case "GetGuidelineVersion": return new GetGuidelineVersionSerializer();
      case "Health": return new HealthSerializer();
      case "ListCompanies": return new ListCompaniesSerializer();
      case "ListConversations": return new ListConversationsSerializer();
      case "ListCorrections": return new ListCorrectionsSerializer();
      case "ListGuidelineVersions": return new ListGuidelineVersionsSerializer();
      case "Login": return new LoginSerializer();
      case "Logout": return new LogoutSerializer();
      case "RefreshToken": return new RefreshTokenSerializer();
      case "RetryGuidelineVersion": return new RetryGuidelineVersionSerializer();
      case "SendMessage": return new SendMessageSerializer();
      case "SubmitFeedback": return new SubmitFeedbackSerializer();
      case "UpdateCompany": return new UpdateCompanySerializer();
      case "UpdateCorrection": return new UpdateCorrectionSerializer();
      case "UploadGuidelines": return new UploadGuidelinesSerializer();
    }
  };
  const customizer: __ValidationCustomizer<SupportAssistantServiceOperations> = (ctx, failures) => {
    if (!failures) {
      return undefined;
    }
    return {
      name: "ValidationException",
      $fault: "client",
      message: __generateValidationSummary(failures),
      fieldList: failures.map(failure => ({
        path: failure.path,
        message: __generateValidationMessage(failure)
      }))
    };
  };
  return new SupportAssistantServiceHandler(service, mux, serFn, serializeFrameworkException, customizer);
}
