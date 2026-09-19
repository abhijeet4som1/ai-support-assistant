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
  ServerSerdeContext,
  ServerSerdeContext as __ServerSerdeContext,
  ServiceException as __BaseException,
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

import {
  GuidelinesNotReadyError,
  InternalServerError,
  NotFoundError,
  RateLimitedError,
  UnauthorizedError,
  ValidationException,
} from "../../models/errors";
import { GetActiveGuidelinesInput, GetActiveGuidelinesOutput } from "../../models/models_0";
import {
  deserializeGetActiveGuidelinesRequest,
  serializeFrameworkException,
  serializeGetActiveGuidelinesResponse,
  serializeGuidelinesNotReadyErrorError,
  serializeInternalServerErrorError,
  serializeNotFoundErrorError,
  serializeRateLimitedErrorError,
  serializeUnauthorizedErrorError,
  serializeValidationExceptionError,
} from "../../protocols/Aws_restJson1";
import { SupportAssistantService } from "../SupportAssistantService";

export type GetActiveGuidelines<Context> = __Operation<GetActiveGuidelinesServerInput, GetActiveGuidelinesServerOutput, Context>

export interface GetActiveGuidelinesServerInput extends GetActiveGuidelinesInput {}
export namespace GetActiveGuidelinesServerInput {
  /**
   * @internal
   */
  export const validate: (obj: Parameters<typeof GetActiveGuidelinesInput.validate>[0]) => __ValidationFailure[] = GetActiveGuidelinesInput.validate;
}
export interface GetActiveGuidelinesServerOutput extends GetActiveGuidelinesOutput {}

export type GetActiveGuidelinesErrors = NotFoundError | GuidelinesNotReadyError | ValidationException | UnauthorizedError | RateLimitedError | InternalServerError

export class GetActiveGuidelinesSerializer implements __OperationSerializer<SupportAssistantService<any>, "GetActiveGuidelines", GetActiveGuidelinesErrors> {
  serialize = serializeGetActiveGuidelinesResponse;
  deserialize = deserializeGetActiveGuidelinesRequest;

  isOperationError(error: any): error is GetActiveGuidelinesErrors {
    const names: GetActiveGuidelinesErrors['name'][] = ["NotFoundError", "GuidelinesNotReadyError", "ValidationException", "UnauthorizedError", "RateLimitedError", "InternalServerError"];
    return names.includes(error.name);
  };

  serializeError(error: GetActiveGuidelinesErrors, ctx: ServerSerdeContext): Promise<__HttpResponse> {
    switch (error.name) {
      case "NotFoundError": {
        return serializeNotFoundErrorError(error, ctx);
      }
      case "GuidelinesNotReadyError": {
        return serializeGuidelinesNotReadyErrorError(error, ctx);
      }
      case "ValidationException": {
        return serializeValidationExceptionError(error, ctx);
      }
      case "UnauthorizedError": {
        return serializeUnauthorizedErrorError(error, ctx);
      }
      case "RateLimitedError": {
        return serializeRateLimitedErrorError(error, ctx);
      }
      case "InternalServerError": {
        return serializeInternalServerErrorError(error, ctx);
      }
      default: {
        throw error;
      }
    }
  }

}

export const getGetActiveGuidelinesHandler = <Context>(operation: __Operation<GetActiveGuidelinesServerInput, GetActiveGuidelinesServerOutput, Context>): __ServiceHandler<Context, __HttpRequest, __HttpResponse> => {
  const mux = new httpbinding.HttpBindingMux<"SupportAssistant", "GetActiveGuidelines">([
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
  ]);
  const customizer: __ValidationCustomizer<"GetActiveGuidelines"> = (ctx, failures) => {
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
  return new GetActiveGuidelinesHandler(operation, mux, new GetActiveGuidelinesSerializer(), serializeFrameworkException, customizer);
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
export class GetActiveGuidelinesHandler<Context> implements __ServiceHandler<Context> {
  private readonly mux: __Mux<"SupportAssistant", "GetActiveGuidelines">;
  private readonly operation: __Operation<GetActiveGuidelinesServerInput, GetActiveGuidelinesServerOutput, Context>;
  private readonly serializer: __OperationSerializer<SupportAssistantService<Context>, "GetActiveGuidelines", GetActiveGuidelinesErrors>;
  private readonly serializeFrameworkException: (e: __SmithyFrameworkException, ctx: __ServerSerdeContext) => Promise<__HttpResponse>;
  private readonly validationCustomizer: __ValidationCustomizer<"GetActiveGuidelines">;
  private readonly interceptors: __ServerInterceptor<Context>[] = [];
  private readonly authSchemes: __AuthScheme<Context>[] = [];
  private metricsRecorderFactory?: __MetricsRecorderFactory<any>;
  /**
   * Construct a GetActiveGuidelines handler.
   * @param operation The {@link __Operation} implementation that supplies the business logic for GetActiveGuidelines
   * @param mux The {@link __Mux} that verifies which service and operation are being invoked by a given {@link __HttpRequest}
   * @param serializer An {@link __OperationSerializer} for GetActiveGuidelines that
   *                   handles deserialization of requests and serialization of responses
   * @param serializeFrameworkException A function that can serialize {@link __SmithyFrameworkException}s
   * @param validationCustomizer A {@link __ValidationCustomizer} for turning validation failures into {@link __SmithyFrameworkException}s
   */
  constructor(
    operation: __Operation<GetActiveGuidelinesServerInput, GetActiveGuidelinesServerOutput, Context>,
    mux: __Mux<"SupportAssistant", "GetActiveGuidelines">,
    serializer: __OperationSerializer<SupportAssistantService<Context>, "GetActiveGuidelines", GetActiveGuidelinesErrors>,
    serializeFrameworkException: (e: __SmithyFrameworkException, ctx: __ServerSerdeContext) => Promise<__HttpResponse>,
    validationCustomizer: __ValidationCustomizer<"GetActiveGuidelines">
  ) {
    this.operation = operation;
    this.mux = mux;
    this.serializer = serializer;
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
      route: (request) => this.mux.match(request) !== undefined ? "GetActiveGuidelines" : undefined,
      deserialize: (_op, request) => timed("DeserializationTime", async () => {
        try {
          return await this.serializer.deserialize(request, { endpoint: () => Promise.resolve(request), ...serdeContextBase });
        } catch (error: unknown) {
          if (__isFrameworkException(error)) {
            throw error;
          }
          throw new __SerializationException();
        }
      }),
      validate: (_op, input) => timedSync("ValidationTime", () => {
        const validationFailures = (GetActiveGuidelinesServerInput.validate as (input: any) => __ValidationFailure[])(input);
        if (validationFailures && validationFailures.length > 0) {
          const validationException = this.validationCustomizer({ operation: "GetActiveGuidelines" }, validationFailures);
          if (validationException) {
            throw validationException;
          }
        }
      }),
      invoke: (_op, input, context) => timed("ActivityTime", () => this.operation(input as GetActiveGuidelinesServerInput, context)),
      serialize: (_op, output) => timed("SerializationTime", () => this.serializer.serialize(output as GetActiveGuidelinesServerOutput, serdeContextBase)),
      serializeError: (_op, error) => this.serializer.isOperationError(error) ? this.serializer.serializeError(error, serdeContextBase) : undefined,
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
