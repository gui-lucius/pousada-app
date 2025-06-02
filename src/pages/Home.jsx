import { useState, useEffect } from "react";
import { db } from "../db/database";
import CalendarioReservas from "../componentes/calendario/CalendarioReservas";

function Home() {
  const [hospedes, setHospedes] = useState([]);
  const [form, setForm] = useState({
    nome: "",
    chale: "",
    checkin: "",
    checkout: "",
  });

  useEffect(() => {
    buscarHospedes();
  }, []);

  const buscarHospedes = async () => {
    const lista = await db.hospedes.toArray();
    setHospedes(lista);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nome || !form.chale || !form.checkin) return;

    await db.hospedes.add(form);
    setForm({ nome: "", chale: "", checkin: "", checkout: "" });
    buscarHospedes();
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-10">
      <div>
        <h1 className="text-2xl font-bold mb-4 text-blue-700">Check-in de Hóspede</h1>
        <form onSubmit={handleSubmit} className="space-y-3 bg-white p-4 rounded shadow">
          <input
            type="text"
            name="nome"
            value={form.nome}
            onChange={handleChange}
            placeholder="Nome do hóspede"
            className="w-full border p-2 rounded"
          />
          <input
            type="text"
            name="chale"
            value={form.chale}
            onChange={handleChange}
            placeholder="Chalé"
            className="w-full border p-2 rounded"
          />
          <input
            type="date"
            name="checkin"
            value={form.checkin}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
          <input
            type="date"
            name="checkout"
            value={form.checkout}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Fazer Check-in
          </button>
        </form>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-2">Hóspedes hospedados</h2>
        <ul className="space-y-2">
          {hospedes.map((h) => (
            <li key={h.id} className="border p-3 rounded shadow-sm">
              <strong>{h.nome}</strong> no chalé <strong>{h.chale}</strong> <br />
              Entrada: {h.checkin} | Saída: {h.checkout || "não informada"}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <CalendarioReservas />
      </div>
    </div>
  );
}

export default Home;
