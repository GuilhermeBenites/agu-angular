import { HttpErrorResponse } from '@angular/common/http';
import { ApiFailure } from './auth.models';

export function apiFailure(error: unknown): ApiFailure {
  if (
    error instanceof HttpErrorResponse &&
    typeof error.error === 'object' &&
    error.error !== null
  ) {
    const payload = error.error;
    const failure: unknown = payload.error;
    if (
      typeof failure === 'object' &&
      failure !== null &&
      'code' in failure &&
      typeof failure.code === 'string' &&
      'message' in failure &&
      typeof failure.message === 'string'
    ) {
      const details =
        'details' in failure && Array.isArray(failure.details)
          ? failure.details
              .filter(
                (item: unknown): item is { field: string; message: string } =>
                  typeof item === 'object' &&
                  item !== null &&
                  'field' in item &&
                  typeof item.field === 'string' &&
                  'message' in item &&
                  typeof item.message === 'string',
              )
              .map(({ field, message }) => ({ field, message }))
          : [];
      return {
        code: failure.code,
        message: failure.message,
        details,
        ...(typeof payload.requestId === 'string' ? { requestId: payload.requestId } : {}),
      };
    }
  }
  return {
    code: 'unavailable',
    message: 'Não foi possível concluir a operação. Verifique sua conexão e tente novamente.',
    details: [],
  };
}
