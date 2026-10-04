import { ApiError } from "@/lib/api";

export type AuthField = "nombre" | "cedula" | "correo" | "clave";

/** Maps a failed sign-in / sign-up to a copy key and, when possible, the field to blame. */
export function explainAuthError(error: unknown): { key: string; field?: AuthField } {
  if (!(error instanceof ApiError)) {
    // fetch() rejects with a TypeError when the server can't be reached.
    return { key: error instanceof TypeError ? "error.conexion" : "error.generico" };
  }

  const detail = error.detail;
  const text = typeof detail === "string" ? detail.toLowerCase() : "";
  const fields = Array.isArray(detail)
    ? detail.flatMap((item: { loc?: unknown[] }) => (Array.isArray(item?.loc) ? item.loc.map(String) : []))
    : [];

  switch (error.status) {
    case 401:
      return { key: "error.credenciales" };
    case 403:
      return { key: "error.desactivada" };
    case 409:
      if (text.includes("document")) return { key: "error.cedulaExiste", field: "cedula" };
      return { key: "error.correoExiste", field: "correo" };
    case 422:
      if (text.includes("reserved")) return { key: "error.nombreReservado", field: "nombre" };
      if (text.includes("display_name") || fields.includes("display_name")) return { key: "error.nombre", field: "nombre" };
      if (text.includes("document") || fields.includes("document_id")) return { key: "error.cedula", field: "cedula" };
      if (fields.includes("email")) return { key: "error.correo", field: "correo" };
      if (fields.includes("password")) return { key: "error.clave", field: "clave" };
      return { key: "error.generico" };
    case 429:
      return { key: "error.muchosIntentos" };
    default:
      return { key: "error.generico" };
  }
}
