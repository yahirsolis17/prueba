//App principal
let stream = null; // Mediastream actual de la camara
let currentFacing = 'environment'; // User = frontal y Enviroment = trasera
let mediaRecorder = null; // Instancia de mediarecorder para audio
let chunks = [];	//Buffers para audio grabado
let beforeInstallEvent = null;	//Evento diferido para mostrar el boton de instalacion

//Accesos rapidos al DOM
const $ = (sel) => document.querySelector(sel);
const video = $('#video');	// Etiqueta video donde se muestra el stream
const canvas = $('#canvas'); //Contenedor de capturar fotos
const photos = $('#photos'); //Contenedor de fotos capturadas
const audios = $('#audios'); //Contenedor para audios grabados
const btnStartCam = $('#btnStartCam'); // Boton iniciar camara
const btnStopCam = $('#btnStopCam'); // Boton detener camara
const btnFlip = $('#btnFlip'); // Boton alternar camara
const btnTorch = $('#btnTorch'); // Boton linterna
const btnShot = $('#btnShot'); // Boton tomar foto
const videoDevices = $('#videoDevices'); // Select para camaras disponibles
const btnStartRec = $('#btnStartRec'); // Boton iniciar grabacion de audio
const btnStopRec = $('#btnStopRec'); // Boton detener grabacion de audio
const recStatus = $('#recStatus'); // Indicador del estado de grabacion
const btnInstall = $('#btnInstall'); // Boton instalar la PWA

//Instalacion de la PWA (A2HS)
window.addEventListener('beforeinstallprompt' , (e)=> {
	e.preventDefault(); //Evitar que el navegador muestre el prompt por defecto
	beforeInstallEvent = e; // Guardar el evento para lanzarlo manualmente
	btnInstall.hidden = false; //Mostrar el boton "Instalar"
});

btnInstall.addEventListener('click', async () => {
	if (!beforeInstallEvent) return; // Si no hay evento almacenado no hacemos nada
	beforeInstallEvent.prompt(); // Dispara el dialogo de instalacion
	await beforeInstallEvent.userChoice; //Espera la eleccion del usuario
	btnInstall.hidden = true; //Oculta el boton tras la decision
	beforeInstallEvent = null; //Limpia la referencia
});

//Camara listado y control
async function listVideoInputs() {
	try {
		//Pide al navegador todos los dispositivos multimedia
		const devices = await navigator.mediaDevices.enumerateDevices();
		//Filtra solo entradas de video
		const cams = devices.filter(d => d.kind === 'videoinput');

		//Vacia el select y lo rellena con las camaras detectas 
		videoDevices.innerHTML = '';
		cams.forEach((d, i) => {
			const opt = document.createElement('option');
			opt.value = d.deviceId;
			opt.textContent = d.label || `Camara ${i+1}`; //deviceId que usaremos para getUserMedia
			videoDevices.appendChild(opt);
		});
	} catch (err){
		console.warn('No se pudo enumerar dispositivos.', err);
	}
}

async function startCam(constraints = {}) {
	//Verifica el soporte de mediaDevices a traves de HTTPS
	if (!('mediaDevices' in navigator)) {
		alert('Este navegador no soporta el acceso a Camara/Microfono');
		return;
	}
	try {
		//Solicita el stream de video (mas cualquier constraint extra recibido)
		stream = await navigator.mediaDevices.getUserMedia({
			video: { facingMode: currentFacing, ...constraints },
			audio: false
		});

		//Enlaza el stream al select de video para previsualizar
		video.srcObject = stream;

		//Habilitar los controles relacionados
		btnStopCam.disabled = false;
		btnShot.disabled = false;
		btnFlip.disabled = false;
		btnTorch.disabled = false;

		//Actualiza el listado de camaras disponibles
		await listVideoInputs();
	} catch (err) {
		alert('No se pudo iniciar la camara: ' + err.message);
		console.error(err);
	}
}

function stopCam(){
	//Detiene todas las pistas del stream de video y libera la camara
	if (stream) { stream.getTracks().forEach(t => t.stop()); }
	stream = null;
	video.srcObject = null;

	//Deshabilita controles de camara
	btnStopCam.disabled = true;
	btnShot.disabled = true;
	btnFlip.disabled = true;
	btnTorch.disabled = true;
}

//Botones de control de camara
btnStartCam.addEventListener('click', () => startCam());
btnStopCam.addEventListener('click', stopCam);

btnFlip.addEventListener('click', async () => {
	//Alterna entre camara frontal y trasera y reinicia el stream
	currentFacing = (currentFacing === 'environment') ? 'user' : 'environment';
	stopCam();
	await startCam;
});

videoDevices.addEventListener('change', async (e) => {
	//Cambia a un deviceid especifico elegido en el select
	const id = e.target.value;
	stopCam();
	await startCam({ deviceId: {exact: id } });
});

btnTorch.addEventListener('click', async () => {
	//Algunas plataformas permiten activar la linterna con applyConstraints
	try {
		const [track] = stream ? stream.getVideoTracks() : [];
		if (!track) return;
		const cts = track.getConstraints();
		//Alterna el estado del torch de forma simple (usando naive toggle)
		const torch = !(cts.advanced && cts.advanced[0]?.torch);
		await track.applyConstraints({ advanced: [{ torch}] });
	} catch (err) {
		alert('La linterna no es compatible con este dispositivo/navegador.');
	}
});







 

