import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  NavLink,
  useNavigate,
} from "react-router-dom";

import { useAdminAuth } from "../../hooks/useAdminAuth";
import { useAdminNotifications } from "../../hooks/useAdminNotifications";

// ============================================================
// TIPOS
// ============================================================

type BadgeKey =
  | "requests"
  | "partners"
  | "points";

interface NavChild {
  to: string;
  label: string;
  badgeKey?: BadgeKey;
}

interface NavItem {
  to?: string;
  label: string;
  iconSrc: string;
  badgeKey?: BadgeKey;
  isDropdown?: boolean;
  children?: NavChild[];
}

// ============================================================
// ITENS DO MENU
// ============================================================

const NAV_ITEMS: NavItem[] = [
  {
    to: "/admin/dashboard",
    label: "Dashboard",
    iconSrc: "/assets/icons/icon-dashboard.svg",
  },

  {
    to: "/admin/requests",
    label: "Solicitações",
    iconSrc: "/assets/icons/icon-solicitacao.svg",
    badgeKey: "requests",
  },

  {
    to: "/admin/map",
    label: "Mapa",
    iconSrc: "/assets/icons/map.svg",
  },

  {
    to: "/admin/my-points",
    label: "Pontos",
    iconSrc: "/assets/icons/icon-pontos.svg",
    badgeKey: "points",
  },

  {
    label: "Parceiros",
    iconSrc: "/assets/icons/profile.svg",
    isDropdown: true,
    badgeKey: "partners",

    children: [
      {
        to: "/admin/partners-approval",
        label: "Locais Parceiros",
        badgeKey: "partners",
      },

      {
        to: "/admin/indicators",
        label: "Parceiros Indicadores",
      },
    ],
  },
];

// ============================================================
// BADGE
// ============================================================

function NavBadge({
  count,
  dot = false,
}: {
  count: number;
  dot?: boolean;
}) {
  if (count <= 0) {
    return null;
  }

  if (dot) {
    return (
      <span
        className="
          absolute
          -top-0.5
          -right-0.5
          w-2.5
          h-2.5
          rounded-full
          bg-red-600
          border-2
          border-white-primary
        "
      />
    );
  }

  return (
    <span
      className="
        absolute
        -top-1.5
        -right-2
        min-w-[16px]
        h-4
        px-1
        rounded-full
        bg-red-600
        text-white
        text-[10px]
        font-bold
        flex
        items-center
        justify-center
        leading-none
        border-2
        border-white-primary
      "
    >
      {count > 9 ? "9+" : count}
    </span>
  );
}

// ============================================================
// COMPONENTE
// ============================================================

function AdminTopNav() {
  const { admin, logout } =
    useAdminAuth();

  const navigate =
    useNavigate();

  const notifications =
    useAdminNotifications();

  // ==========================================================
  // ESTADOS
  // ==========================================================

  const [
    isMenuOpen,
    setIsMenuOpen,
  ] = useState(false);

  const [
    isMobileNavOpen,
    setIsMobileNavOpen,
  ] = useState(false);

  const [
    openDropdown,
    setOpenDropdown,
  ] = useState<string | null>(null);

  const [
    loading,
    setLoading,
  ] = useState(false);

  // ==========================================================
  // REFS
  // ==========================================================

  const menuRef =
    useRef<HTMLDivElement>(null);

  const dropdownRef =
    useRef<HTMLDivElement>(null);

  // ==========================================================
  // NOTIFICAÇÕES
  // ==========================================================

  const getCount = (
    key?: BadgeKey
  ): number => {
    if (!key) {
      return 0;
    }

    return notifications[key] ?? 0;
  };

  /*
   * IMPORTANTE:
   *
   * Não usamos Object.values(notifications),
   * pois notifications também possui:
   *
   * refresh: () => Promise<void>
   *
   * Aqui somamos somente as propriedades numéricas.
   */
  const totalPendencias =
    getCount("requests") +
    getCount("partners") +
    getCount("points");

  // ==========================================================
  // ADMIN
  // ==========================================================

  const inicial =
    admin?.nome
      ?.charAt(0)
      .toUpperCase() ?? "A";

  // ==========================================================
  // LOGOUT
  // ==========================================================

  const handleLogout =
    async () => {
      setLoading(true);

      try {
        if (logout) {
          await logout();
        } else {
          localStorage.removeItem(
            "admin_token"
          );

          localStorage.removeItem(
            "admin_user"
          );
        }
      } catch (error) {
        console.error(
          "Erro ao realizar logout:",
          error
        );
      } finally {
        setTimeout(() => {
          setLoading(false);

          navigate(
            "/admin/login"
          );
        }, 300);
      }
    };

  // ==========================================================
  // PERFIL
  // ==========================================================

  const handleProfile = () => {
    setIsMenuOpen(false);

    setIsMobileNavOpen(false);

    setOpenDropdown(null);

    navigate(
      "/admin/profile-admin"
    );
  };

  // ==========================================================
  // DROPDOWN
  // ==========================================================

  const toggleDropdown = (
    label: string
  ) => {
    setOpenDropdown(
      openDropdown === label
        ? null
        : label
    );
  };

  // ==========================================================
  // FECHAR DROPDOWN AO CLICAR FORA
  // ==========================================================

  useEffect(() => {
    const handleClickOutside = (
      event: MouseEvent
    ) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(
          event.target as Node
        )
      ) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  // ==========================================================
  // FECHAR MENU DO USUÁRIO AO CLICAR FORA
  // ==========================================================

  useEffect(() => {
    const handleClickOutside = (
      event: MouseEvent
    ) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(
          event.target as Node
        )
      ) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  // ==========================================================
  // RENDERIZAR ITEM DO MENU
  // ==========================================================

  const renderNavItem = (
    item: NavItem,
    isMobile = false
  ) => {
    const baseClasses =
      isMobile
        ? `
            flex
            items-center
            gap-3
            px-4
            py-3
            rounded-xl
            text-base
            font-semibold
            transition-all
          `
        : `
            flex
            items-center
            gap-2.5
            px-3.5
            lg:px-4
            py-2.5
            rounded-xl
            text-sm
            lg:text-base
            font-semibold
            transition-all
          `;

    const activeClasses = (
      isActive: boolean
    ) =>
      isActive
        ? `
            bg-green-100
            text-green-primary
          `
        : `
            text-white-600
            hover:text-green-primary
            hover:bg-green-100
          `;

    const count =
      getCount(
        item.badgeKey
      );

    // ========================================================
    // DROPDOWN
    // ========================================================

    if (item.isDropdown) {
      const isOpen =
        openDropdown ===
        item.label;

      const totalChildrenCount =
        item.children?.reduce(
          (
            total,
            child
          ) => {
            return (
              total +
              getCount(
                child.badgeKey
              )
            );
          },
          0
        ) ?? 0;

      return (
        <div
          key={item.label}
          className="relative"
          ref={
            isMobile
              ? undefined
              : dropdownRef
          }
        >
          {/* BOTÃO PARCEIROS */}

          <button
            type="button"
            onClick={() =>
              toggleDropdown(
                item.label
              )
            }
            className={`
              ${baseClasses}

              w-full
              justify-between
              cursor-pointer

              ${
                isOpen
                  ? `
                      bg-green-100
                      text-green-primary
                    `
                  : `
                      text-white-600
                      hover:text-green-primary
                      hover:bg-green-100
                    `
              }
            `}
          >
            <span
              className="
                flex
                items-center
                gap-2.5
              "
            >
              <span
                className="
                  relative
                  inline-flex
                "
              >
                <span
                  className="
                    w-4
                    h-4
                    bg-current
                    inline-block
                    transition-colors
                  "
                  style={{
                    maskImage:
                      `url(${item.iconSrc})`,

                    maskRepeat:
                      "no-repeat",

                    maskPosition:
                      "center",

                    maskSize:
                      "contain",

                    WebkitMaskImage:
                      `url(${item.iconSrc})`,

                    WebkitMaskRepeat:
                      "no-repeat",

                    WebkitMaskPosition:
                      "center",

                    WebkitMaskSize:
                      "contain",
                  }}
                />

                <NavBadge
                  count={
                    totalChildrenCount
                  }
                />
              </span>

              <span>
                {item.label}
              </span>
            </span>

            {/* SETA */}

            <svg
              className={`
                w-4
                h-4
                transition-transform

                ${
                  isOpen
                    ? "rotate-180"
                    : ""
                }
              `}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {/* SUBMENU */}

          {isOpen && (
            <div
              className={
                isMobile
                  ? `
                      ml-4
                      mt-1
                      space-y-1
                    `
                  : `
                      absolute
                      left-0
                      mt-1
                      w-64
                      bg-white-primary
                      rounded-xl
                      shadow-lg
                      border
                      border-white-100
                      py-1
                      z-[100]
                    `
              }
            >
              {item.children?.map(
                (child) => {
                  const childCount =
                    getCount(
                      child.badgeKey
                    );

                  return (
                    <NavLink
                      key={child.to}
                      to={child.to}
                      onClick={() => {
                        setOpenDropdown(
                          null
                        );

                        if (
                          isMobile
                        ) {
                          setIsMobileNavOpen(
                            false
                          );
                        }
                      }}
                      className={({
                        isActive,
                      }) =>
                        `
                          ${baseClasses}

                          ${activeClasses(
                            isActive
                          )}
                        `
                      }
                    >
                      <span
                        className="
                          relative
                          inline-flex
                          shrink-0
                        "
                      >
                        <span
                          className="
                            w-4
                            h-4
                            bg-current
                            inline-block
                            transition-colors
                          "
                          style={{
                            maskImage:
                              `url(${item.iconSrc})`,

                            maskRepeat:
                              "no-repeat",

                            maskPosition:
                              "center",

                            maskSize:
                              "contain",

                            WebkitMaskImage:
                              `url(${item.iconSrc})`,

                            WebkitMaskRepeat:
                              "no-repeat",

                            WebkitMaskPosition:
                              "center",

                            WebkitMaskSize:
                              "contain",
                          }}
                        />

                        {child.badgeKey && (
                          <NavBadge
                            count={
                              childCount
                            }
                          />
                        )}
                      </span>

                      <span>
                        {child.label}
                      </span>
                    </NavLink>
                  );
                }
              )}
            </div>
          )}
        </div>
      );
    }

    // ========================================================
    // ITEM NORMAL
    // ========================================================

    return (
      <NavLink
        key={item.to}
        to={item.to!}
        onClick={() => {
          setOpenDropdown(null);

          if (isMobile) {
            setIsMobileNavOpen(
              false
            );
          }
        }}
        className={({
          isActive,
        }) =>
          `
            ${baseClasses}

            ${activeClasses(
              isActive
            )}
          `
        }
      >
        <span
          className="
            relative
            inline-flex
          "
        >
          <span
            className="
              w-4
              h-4
              bg-current
              inline-block
              transition-colors
            "
            style={{
              maskImage:
                `url(${item.iconSrc})`,

              maskRepeat:
                "no-repeat",

              maskPosition:
                "center",

              maskSize:
                "contain",

              WebkitMaskImage:
                `url(${item.iconSrc})`,

              WebkitMaskRepeat:
                "no-repeat",

              WebkitMaskPosition:
                "center",

              WebkitMaskSize:
                "contain",
            }}
          />

          {item.badgeKey && (
            <NavBadge
              count={count}
            />
          )}
        </span>

        <span>
          {item.label}
        </span>
      </NavLink>
    );
  };

  // ==========================================================
  // RETURN
  // ==========================================================

  return (
    <header
      className="
        relative
        bg-white-primary
        border-b
        border-white-200
        z-40
      "
    >
      {/* ================================================= */}
      {/* BARRA PRINCIPAL                                  */}
      {/* ================================================= */}

      <div
        className="
          flex
          items-center
          justify-between
          px-4
          sm:px-6
          lg:px-12
          py-3.5
          sm:py-5
          w-full
        "
      >
        {/* MENU MOBILE */}

        <button
          type="button"
          onClick={() =>
            setIsMobileNavOpen(
              true
            )
          }
          className="
            relative
            md:hidden
            p-2
            rounded-lg
            text-black-200
            hover:bg-green-100
            hover:text-green-primary
            focus:outline-none
            transition-colors
          "
          aria-label="Abrir menu lateral"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="
                M4 6h16
                M4 12h16
                M4 18h16
              "
            />
          </svg>

          <NavBadge
            count={
              totalPendencias
            }
            dot
          />
        </button>

        {/* LOGO */}

        <div
          className="
            flex
            items-center
            justify-center
            md:justify-start
          "
        >
          <img
            src="/assets/logo-horizontal.svg"
            alt="Logo do Óleo Circular"
            className="
              h-8
              sm:h-10
              md:h-11
              w-auto
              cursor-pointer
            "
            onClick={() =>
              navigate(
                "/admin/dashboard"
              )
            }
          />
        </div>

        {/* NAVEGAÇÃO DESKTOP */}

        <nav
          className="
            hidden
            md:flex
            items-center
            gap-1
            lg:gap-2
          "
        >
          {NAV_ITEMS.map(
            (item) =>
              renderNavItem(
                item,
                false
              )
          )}
        </nav>

        {/* ================================================= */}
        {/* MENU DO ADMIN                                    */}
        {/* ================================================= */}

        <div
          className="relative"
          ref={menuRef}
        >
          <button
            type="button"
            onClick={() =>
              setIsMenuOpen(
                !isMenuOpen
              )
            }
            className="
              focus:outline-none
              focus:ring-2
              focus:ring-green-primary
              rounded-full
              transition-all
              duration-200
              hover:ring-2
              hover:ring-green-primary
              cursor-pointer
            "
            aria-label="Menu do usuário"
          >
            <div
              className="
                w-9
                h-9
                sm:w-10
                sm:h-10
                rounded-full
                bg-green-primary
                text-white-primary
                flex
                items-center
                justify-center
                text-sm
                sm:text-base
                font-bold
                border-2
                border-green-primary
                shadow-sm
              "
            >
              {inicial}
            </div>
          </button>

          {/* MENU ABERTO */}

          {isMenuOpen && (
            <div
              className="
                absolute
                right-0
                mt-2
                w-48
                bg-white-primary
                rounded-xl
                shadow-lg
                border
                border-white-100
                py-1
                z-[100]
                animate-slide-down
              "
            >
              {/* PERFIL */}

              <button
                type="button"
                onClick={
                  handleProfile
                }
                className="
                  w-full
                  flex
                  items-center
                  gap-3
                  px-4
                  py-3
                  text-sm
                  text-black-200
                  hover:bg-green-100
                  hover:text-green-primary
                  transition-colors
                  duration-150
                  cursor-pointer
                "
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="
                      M16 7a4 4 0 11-8 0
                      4 4 0 018 0z
                      M12 14a7 7 0 00-7 7h14
                      a7 7 0 00-7-7z
                    "
                  />
                </svg>

                Perfil
              </button>

              {/* SAIR */}

              <button
                type="button"
                onClick={
                  handleLogout
                }
                disabled={
                  loading
                }
                className="
                  w-full
                  flex
                  items-center
                  gap-3
                  px-4
                  py-3
                  text-sm
                  text-red-600
                  hover:bg-red-100
                  transition-colors
                  duration-150
                  disabled:opacity-50
                  cursor-pointer
                "
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="
                      M17 16l4-4
                      m0 0l-4-4
                      m4 4H7
                      m6 4v1
                      a3 3 0 01-3 3H6
                      a3 3 0 01-3-3V7
                      a3 3 0 013-3h4
                      a3 3 0 013 3v1
                    "
                  />
                </svg>

                {loading
                  ? "Saindo..."
                  : "Sair"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ================================================= */}
      {/* MENU MOBILE                                      */}
      {/* ================================================= */}

      {isMobileNavOpen && (
        <div
          className="
            fixed
            inset-0
            z-50
            md:hidden
            flex
          "
        >
          {/* BACKDROP */}

          <div
            className="
              fixed
              inset-0
              bg-black/40
              backdrop-blur-xs
              transition-opacity
            "
            onClick={() =>
              setIsMobileNavOpen(
                false
              )
            }
          />

          {/* SIDEBAR */}

          <div
            className="
              relative
              w-4/5
              max-w-xs
              bg-white-primary
              h-full
              shadow-2xl
              flex
              flex-col
              justify-between
              p-5
              z-10
              animate-slide-right
            "
          >
            <div>
              {/* HEADER */}

              <div
                className="
                  flex
                  items-center
                  justify-between
                  pb-4
                  border-b
                  border-white-100
                  mb-6
                "
              >
                <img
                  src="/assets/logo-horizontal.svg"
                  alt="Logo do Óleo Circular"
                  className="h-8 w-auto"
                />

                <button
                  type="button"
                  onClick={() =>
                    setIsMobileNavOpen(
                      false
                    )
                  }
                  className="
                    p-1.5
                    rounded-lg
                    text-white-600
                    hover:bg-white-100
                    hover:text-black-primary
                    transition-colors
                  "
                  aria-label="Fechar menu"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="
                        M6 18L18 6
                        M6 6l12 12
                      "
                    />
                  </svg>
                </button>
              </div>

              {/* NAVEGAÇÃO MOBILE */}

              <nav
                className="
                  flex
                  flex-col
                  gap-2
                "
              >
                {NAV_ITEMS.map(
                  (item) =>
                    renderNavItem(
                      item,
                      true
                    )
                )}
              </nav>
            </div>

            {/* ================================================= */}
            {/* PERFIL MOBILE                                    */}
            {/* ================================================= */}

            <div
              className="
                pt-4
                border-t
                border-white-100
              "
            >
              <div
                className="
                  flex
                  items-center
                  justify-between
                "
              >
                <div
                  className="
                    flex
                    items-center
                    gap-3
                    cursor-pointer
                  "
                  onClick={
                    handleProfile
                  }
                >
                  <div
                    className="
                      w-10
                      h-10
                      rounded-full
                      bg-green-primary
                      text-white-primary
                      flex
                      items-center
                      justify-center
                      font-bold
                    "
                  >
                    {inicial}
                  </div>

                  <div
                    className="
                      flex
                      flex-col
                    "
                  >
                    <span
                      className="
                        font-semibold
                        text-black-primary
                        text-sm
                        line-clamp-1
                      "
                    >
                      {admin?.nome ??
                        "Administrador"}
                    </span>

                    <span
                      className="
                        text-xs
                        text-white-500
                      "
                    >
                      Ver Perfil
                    </span>
                  </div>
                </div>

                {/* LOGOUT */}

                <button
                  type="button"
                  onClick={
                    handleLogout
                  }
                  disabled={
                    loading
                  }
                  className="
                    p-2
                    text-red-600
                    hover:bg-red-100
                    rounded-lg
                    transition-colors
                    cursor-pointer
                    disabled:opacity-50
                  "
                  title="Sair da conta"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="
                        M17 16l4-4
                        m0 0l-4-4
                        m4 4H7
                        m6 4v1
                        a3 3 0 01-3 3H6
                        a3 3 0 01-3-3V7
                        a3 3 0 013-3h4
                        a3 3 0 013 3v1
                      "
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export default AdminTopNav;