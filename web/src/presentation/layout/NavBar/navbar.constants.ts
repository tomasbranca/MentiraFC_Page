import { ROUTES } from "../../constants/routes.constants";

export const NAV_LINKS = [
  { label: "NOTICIAS", to: ROUTES.NEWS },
  { label: "GALERIA", to: ROUTES.GALLERY },
  { label: "PLANTEL", to: ROUTES.TEAM },
  { label: "TABLA", to: ROUTES.TABLE },
  { label: "HISTORIAL", to: ROUTES.RECORD },
];

export const AUTH_LINK = {
  label: "INGRESAR",
  to: ROUTES.LOGIN,
};
