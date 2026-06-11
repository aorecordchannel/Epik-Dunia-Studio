exports.handler = async (event, context) => {
  // Method hanya POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ success: false, error: 'Method Not Allowed' })
    };
  }

  try {
    // Parse JSON body
    const body = JSON.parse(event.body);
    const { username, password } = body;

    // Ambil env
    const envUser = process.env.ADMIN_USERNAME;
    const envPass = process.env.ADMIN_PASSWORD;
    const envSecret = process.env.ADMIN_SESSION_SECRET;

    // Jika ENV belum di-set
    if (!envUser || !envPass || !envSecret) {
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          success: false, 
          error: 'Environment admin belum dikonfigurasi. Isi ADMIN_USERNAME, ADMIN_PASSWORD, dan ADMIN_SESSION_SECRET.' 
        })
      };
    }

    // Jika username/password benar
    if (username === envUser && password === envPass) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          token: envSecret,
          message: 'Login admin berhasil'
        })
      };
    }

    // Jika salah
    return {
      statusCode: 401,
      body: JSON.stringify({ success: false, error: 'Username atau password admin salah' })
    };

  } catch (error) {
    return {
      statusCode: 400,
      body: JSON.stringify({ success: false, error: 'Bad Request' })
    };
  }
};
