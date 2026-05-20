import { Toaster } from "react-hot-toast";

const AppToaster = () => (
  <Toaster
    position="top-right"
    gutter={10}
    containerStyle={{
      top: 88,
      right: 16,
      left: 16,
    }}
    toastOptions={{
      duration: 4200,
      removeDelay: 500,
      ariaProps: {
        role: "status",
        "aria-live": "polite",
      },
      style: {
        width: "fit-content",
        maxWidth: "min(24rem, calc(100vw - 2rem))",
        borderRadius: "4px",
        border: "1px solid rgba(255, 255, 255, 0.12)",
        background: "#151518",
        color: "#f8f7ff",
        boxShadow: "0 18px 36px rgba(0, 0, 0, 0.32)",
        padding: "12px 14px",
        fontSize: "0.875rem",
        lineHeight: "1.45",
      },
      success: {
        duration: 3200,
        iconTheme: {
          primary: "#a78bfa",
          secondary: "#151518",
        },
      },
      error: {
        duration: 5200,
        iconTheme: {
          primary: "#fca5a5",
          secondary: "#151518",
        },
      },
      loading: {
        iconTheme: {
          primary: "#c4b5fd",
          secondary: "#151518",
        },
      },
    }}
  />
);

export default AppToaster;
