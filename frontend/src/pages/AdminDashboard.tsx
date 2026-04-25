import { useEffect, useState } from "react";
import { logout } from "../services/auth";

type Pedido = {
  id: number;
  buyerName: string;
  buyerEmail: string;
  total: number;
  estado: string;
  metodoPago: string;
};

type Resumen = {
  totalPedidos: number;
  totalIngresos: number;
  totalPedidosHoy: number;
  totalIngresosHoy: number;
  pedidosRecientes: Pedido[];
};

export default function AdminDashboard() {
  const [resumen, setResumen] = useState<Resumen>({
    totalPedidos: 0,
    totalIngresos: 0,
    totalPedidosHoy: 0,
    totalIngresosHoy: 0,
    pedidosRecientes: [],
  });

  const handleLogout = () => {
    logout();
    window.location.href = "/admin/login";
  };

  useEffect(() => {
    fetch("http://localhost:3000/reportes")
      .then((res) => res.json())
      .then((data) => {
        setResumen(data);
      })
      .catch(() => {
        console.log("Error cargando reportes");
      });
  }, []);

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "pendiente":
        return "text-yellow-400";
      case "pagado":
        return "text-green-400";
      case "cancelado":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  return (
    <div className="bg-negroSuave min-h-screen text-blancoPuro flex">
      {/* SIDEBAR */}
      <aside className="w-64 bg-[#101318] border-r border-gray-800 p-6 hidden md:block">
        <h2 className="text-xl font-bold mb-6 text-verdeEsmeralda">
          Crisálida · Admin
        </h2>

        <nav className="space-y-3 text-sm">
          <p className="text-gray-400 mb-2 uppercase tracking-wide text-xs">
            Gestión
          </p>
          <a href="#" className="block hover:text-verdeEsmeralda">
            Artistas
          </a>
          <a href="#" className="block hover:text-verdeEsmeralda">
            Obras
          </a>
          <a href="#" className="block hover:text-verdeEsmeralda">
            Categorías
          </a>
        </nav>

        <button
          onClick={handleLogout}
          className="mt-8 text-sm text-gray-400 hover:text-red-400"
        >
          Cerrar sesión
        </button>
      </aside>

      {/* MAIN */}
      <main className="flex-1 p-6">
        {/* HEADER */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-verdeEsmeralda">
            Panel administrativo
          </h1>
        </div>

        {/* 🔥 TARJETAS PRO */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-[#151922] to-[#0e1117] p-5 rounded-xl border border-gray-800 shadow-lg">
            <p className="text-xs text-gray-400">Pedidos hoy</p>
            <h3 className="text-2xl font-bold text-verdeEsmeralda">
              {resumen.totalPedidosHoy}
            </h3>
          </div>

          <div className="bg-gradient-to-br from-[#151922] to-[#0e1117] p-5 rounded-xl border border-gray-800 shadow-lg">
            <p className="text-xs text-gray-400">Ingresos hoy</p>
            <h3 className="text-2xl font-bold text-verdeEsmeralda">
              Bs. {resumen.totalIngresosHoy.toFixed(2)}
            </h3>
          </div>

          <div className="bg-gradient-to-br from-[#151922] to-[#0e1117] p-5 rounded-xl border border-gray-800 shadow-lg">
            <p className="text-xs text-gray-400">Pedidos totales</p>
            <h3 className="text-2xl font-bold">
              {resumen.totalPedidos}
            </h3>
          </div>

          <div className="bg-gradient-to-br from-[#151922] to-[#0e1117] p-5 rounded-xl border border-gray-800 shadow-lg">
            <p className="text-xs text-gray-400">Ingresos totales</p>
            <h3 className="text-2xl font-bold">
              Bs. {resumen.totalIngresos.toFixed(2)}
            </h3>
          </div>
        </div>

        {/* 🔥 TABLA PRO DE PEDIDOS */}
        <div className="bg-[#151922] border border-gray-800 rounded-xl p-5">
          <h2 className="text-lg font-semibold mb-4 text-verdeEsmeralda">
            Pedidos recientes
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-gray-400 border-b border-gray-700">
                <tr>
                  <th className="text-left py-2">#</th>
                  <th className="text-left py-2">Cliente</th>
                  <th className="text-left py-2">Pago</th>
                  <th className="text-left py-2">Total</th>
                  <th className="text-left py-2">Estado</th>
                </tr>
              </thead>

              <tbody>
                {resumen.pedidosRecientes.map((pedido) => (
                  <tr
                    key={pedido.id}
                    className="border-b border-gray-800 hover:bg-[#1c212b]"
                  >
                    <td className="py-2">#{pedido.id}</td>
                    <td>{pedido.buyerName}</td>
                    <td>{pedido.metodoPago}</td>
                    <td>Bs. {Number(pedido.total).toFixed(2)}</td>
                    <td className={getEstadoColor(pedido.estado)}>
                      {pedido.estado}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {resumen.pedidosRecientes.length === 0 && (
              <p className="text-gray-500 text-sm mt-3">
                No hay pedidos aún.
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}