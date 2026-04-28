#backend --login 
const bcrypt = require('bcrypt');

app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query(
      'SELECT * FROM usuarios WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.json({ message: 'Usuario no encontrado' });
    }

    const usuario = result.rows[0];

    const validPassword = await bcrypt.compare(password, usuario.password);

    if (!validPassword) {
      return res.json({ message: 'Contraseña incorrecta' });
    }

    res.json({ message: 'Login exitoso', user: usuario.nombre });

  } catch (error) {
    res.json({ message: 'Error en el servidor' });
  }
});
