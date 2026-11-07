package com.example.srihomeoclinic

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.widget.Toast
import com.srihomeoclinic.app.R
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.launch
import com.example.srihomeoclinic.ui.theme.*

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            SriHomeoClinicTheme(darkTheme = true) {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = BgDark
                ) {
                    SriHomeoClinicApp()
                }
            }
        }
    }
}

enum class ClinicTab {
    HOME, BOOK, TRACK, PRESCRIPTION, DOCTOR
}

data class UserSession(
    val name: String,
    val phone: String,
    val email: String = "",
    val role: String = "patient" // patient, doctor, member, admin
)

data class AppointmentData(
    val refNumber: String = "",
    val patientName: String = "",
    val mode: String = "Online WhatsApp Call",
    val date: String = "",
    val slot: String = "",
    val tokenNumber: Int = 1,
    val stage: Int = 1
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SriHomeoClinicApp() {
    val context = LocalContext.current
    var currentUser by remember { mutableStateOf<UserSession?>(null) }
    var currentTab by remember { mutableStateOf(ClinicTab.HOME) }
    var isTamil by remember { mutableStateOf(false) }
    var activeBooking by remember { mutableStateOf(AppointmentData()) }

    Scaffold(
        topBar = {
            TopAppBar(
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = SurfaceElevated,
                    titleContentColor = Color.White
                ),
                title = {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Image(
                            painter = painterResource(id = R.drawable.sri_logo),
                            contentDescription = "Homoeo Care Logo",
                            modifier = Modifier
                                .size(38.dp)
                                .clip(CircleShape)
                                .background(Color.White)
                        )
                        Column {
                            Text(
                                text = "Sri Homoeo Care",
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color.White
                            )
                            Text(
                                text = if (isTamil) "வேரிலிருந்து முழுமையான குணம்" else "Cure at the Core",
                                fontSize = 11.sp,
                                color = GoldAccent
                            )
                        }
                    }
                },
                actions = {
                    // Language Switcher
                    AssistChip(
                        onClick = { isTamil = !isTamil },
                        label = {
                            Text(
                                text = if (isTamil) "தமிழ்" else "EN",
                                fontSize = 11.sp,
                                color = EmeraldPrimary,
                                fontWeight = FontWeight.Bold
                            )
                        },
                        colors = AssistChipDefaults.assistChipColors(containerColor = SurfaceVariantDark),
                        border = AssistChipDefaults.assistChipBorder(enabled = true, borderColor = EmeraldDark)
                    )

                    // Sign Out Button when authenticated
                    if (currentUser != null) {
                        Spacer(modifier = Modifier.width(4.dp))
                        IconButton(
                            onClick = {
                                currentUser = null
                                Toast.makeText(
                                    context,
                                    if (isTamil) "வெளியேறிவிட்டீர்கள்." else "Signed out.",
                                    Toast.LENGTH_SHORT
                                ).show()
                            }
                        ) {
                            Icon(
                                Icons.Default.ExitToApp,
                                contentDescription = "Sign Out",
                                tint = TextSecondaryDark,
                                modifier = Modifier.size(22.dp)
                            )
                        }
                    }
                    Spacer(modifier = Modifier.width(6.dp))
                }
            )
        },
        bottomBar = {
            // STRICT SPEC: Bottom Navigation is ONLY visible when Authenticated!
            if (currentUser != null && currentUser?.role == "patient") {
                NavigationBar(
                    containerColor = SurfaceElevated,
                    contentColor = Color.White
                ) {
                    NavigationBarItem(
                        selected = currentTab == ClinicTab.HOME,
                        onClick = { currentTab = ClinicTab.HOME },
                        icon = { Icon(Icons.Default.Home, contentDescription = "Home") },
                        label = { Text(if (isTamil) "முகப்பு" else "Home", fontSize = 11.sp) },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = EmeraldPrimary,
                            selectedTextColor = EmeraldPrimary,
                            unselectedIconColor = TextSecondaryDark,
                            unselectedTextColor = TextSecondaryDark,
                            indicatorColor = SurfaceVariantDark
                        )
                    )
                    NavigationBarItem(
                        selected = currentTab == ClinicTab.BOOK,
                        onClick = { currentTab = ClinicTab.BOOK },
                        icon = { Icon(Icons.Default.DateRange, contentDescription = "Book") },
                        label = { Text(if (isTamil) "முன்பதிவு" else "Book", fontSize = 11.sp) },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = EmeraldPrimary,
                            selectedTextColor = EmeraldPrimary,
                            unselectedIconColor = TextSecondaryDark,
                            unselectedTextColor = TextSecondaryDark,
                            indicatorColor = SurfaceVariantDark
                        )
                    )
                    NavigationBarItem(
                        selected = currentTab == ClinicTab.TRACK,
                        onClick = { currentTab = ClinicTab.TRACK },
                        icon = { Icon(Icons.Default.CheckCircle, contentDescription = "Track") },
                        label = { Text(if (isTamil) "நேரடி நிலை" else "Track", fontSize = 11.sp) },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = EmeraldPrimary,
                            selectedTextColor = EmeraldPrimary,
                            unselectedIconColor = TextSecondaryDark,
                            unselectedTextColor = TextSecondaryDark,
                            indicatorColor = SurfaceVariantDark
                        )
                    )
                    NavigationBarItem(
                        selected = currentTab == ClinicTab.PRESCRIPTION,
                        onClick = { currentTab = ClinicTab.PRESCRIPTION },
                        icon = { Icon(Icons.Default.MedicalServices, contentDescription = "Rx & Diet") },
                        label = { Text(if (isTamil) "மருந்து" else "Rx & Diet", fontSize = 11.sp) },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = EmeraldPrimary,
                            selectedTextColor = EmeraldPrimary,
                            unselectedIconColor = TextSecondaryDark,
                            unselectedTextColor = TextSecondaryDark,
                            indicatorColor = SurfaceVariantDark
                        )
                    )
                    NavigationBarItem(
                        selected = currentTab == ClinicTab.DOCTOR,
                        onClick = { currentTab = ClinicTab.DOCTOR },
                        icon = { Icon(Icons.Default.Person, contentDescription = "Doctor") },
                        label = { Text(if (isTamil) "மருத்துவர்" else "Doctor", fontSize = 11.sp) },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = EmeraldPrimary,
                            selectedTextColor = EmeraldPrimary,
                            unselectedIconColor = TextSecondaryDark,
                            unselectedTextColor = TextSecondaryDark,
                            indicatorColor = SurfaceVariantDark
                        )
                    )
                }
            }
        }
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .background(BgDark)
        ) {
            val user = currentUser
            if (user == null) {
                // Unauthenticated State: Clean Login & Register Gate (No guest browsing)
                AuthGateScreen(
                    isTamil = isTamil,
                    onAuthenticated = { session ->
                        currentUser = session
                        activeBooking = activeBooking.copy(patientName = session.name)
                    }
                )
            } else {
                // Authenticated State: Role-Based Dashboard
                when (user.role) {
                    "doctor" -> DoctorDeskScreen(
                        isTamil = isTamil,
                        doctorName = user.name,
                        onSignOut = { currentUser = null }
                    )
                    "member" -> MemberDeskScreen(
                        isTamil = isTamil,
                        memberName = user.name,
                        onSignOut = { currentUser = null }
                    )
                    "admin" -> AdminConsoleScreen(
                        isTamil = isTamil,
                        onSignOut = { currentUser = null }
                    )
                    else -> {
                        // Patient Tabs
                        when (currentTab) {
                            ClinicTab.HOME -> PatientHomeScreen(
                                isTamil = isTamil,
                                user = user,
                                booking = activeBooking,
                                onNavigate = { currentTab = it },
                                onCallClinic = { dialPhone(context, "+919791426526") }
                            )
                            ClinicTab.BOOK -> BookingScreen(
                                isTamil = isTamil,
                                prefillName = user.name,
                                prefillPhone = user.phone,
                                onBookingConfirmed = { booking ->
                                    activeBooking = booking
                                    currentTab = ClinicTab.TRACK
                                }
                            )
                            ClinicTab.TRACK -> TrackerScreen(
                                isTamil = isTamil,
                                booking = activeBooking,
                                onAdvanceStage = {
                                    activeBooking = activeBooking.copy(
                                        stage = if (activeBooking.stage < 5) activeBooking.stage + 1 else 1
                                    )
                                }
                            )
                            ClinicTab.PRESCRIPTION -> PrescriptionScreen(
                                isTamil = isTamil,
                                booking = activeBooking
                            )
                            ClinicTab.DOCTOR -> DoctorScreen(
                                isTamil = isTamil,
                                onCallDoctor = { dialPhone(context, "+919791426526") }
                            )
                        }
                    }
                }
            }
        }
    }
}

// -------------------------------------------------------------
// AUTHENTICATION GATE SCREEN (NO GUEST BROWSING)
// -------------------------------------------------------------
@Composable
fun AuthGateScreen(
    isTamil: Boolean,
    onAuthenticated: (UserSession) -> Unit
) {
    val context = LocalContext.current
    val scrollState = rememberScrollState()
    val coroutineScope = rememberCoroutineScope()

    var isRegisterMode by remember { mutableStateOf(false) }
    var isLoggingIn by remember { mutableStateOf(false) }
    var isRegistering by remember { mutableStateOf(false) }

    // Sign in inputs
    var loginIdentifier by remember { mutableStateOf("") }
    var loginPassword by remember { mutableStateOf("") }

    // Register inputs
    var regName by remember { mutableStateOf("") }
    var regPhone by remember { mutableStateOf("") }
    var regEmail by remember { mutableStateOf("") }
    var regPassword by remember { mutableStateOf("") }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(scrollState)
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        // Clinic Branding Header
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = SurfaceElevated),
            shape = RoundedCornerShape(22.dp),
            elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Image(
                    painter = painterResource(id = R.drawable.sri_logo),
                    contentDescription = "Official Sri Homoeo Care Logo",
                    modifier = Modifier
                        .size(105.dp)
                        .clip(CircleShape)
                        .background(Color.White)
                        .border(2.dp, GoldAccent, CircleShape)
                        .padding(4.dp)
                )
                Spacer(modifier = Modifier.height(10.dp))
                Text(
                    text = "SRI HOMOEO CARE",
                    fontSize = 21.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = Color.White,
                    letterSpacing = 1.sp
                )
                Text(
                    text = if (isTamil) "வேரிலிருந்து முழுமையான குணம்" else "Cure at the Core",
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Medium,
                    color = GoldAccent
                )
                Spacer(modifier = Modifier.height(8.dp))
                Surface(
                    color = SurfaceVariantDark,
                    shape = RoundedCornerShape(20.dp)
                ) {
                    Text(
                        text = "Dr. Sriindhuja C · BHMS, MSc (Psychology)",
                        modifier = Modifier.padding(horizontal = 14.dp, vertical = 6.dp),
                        fontSize = 12.sp,
                        color = EmeraldPrimary,
                        fontWeight = FontWeight.SemiBold
                    )
                }
            }
        }

        // Highlights Banner: Online Active & In-Clinic Coming Soon
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            InfoChip(
                modifier = Modifier.weight(1f),
                title = if (isTamil) "ஆலோசனை முறை" else "Consultations",
                value = if (isTamil) "ஆன்லைன் நேரலை (நேரடி விரைவில்)" else "Online Active (In-Clinic Soon)",
                icon = Icons.Default.MedicalServices
            )
            InfoChip(
                modifier = Modifier.weight(1f),
                title = if (isTamil) "நேரம்" else "Daily Hours",
                value = "6:00 – 8:00 PM IST",
                icon = Icons.Default.Schedule
            )
        }

        // Authentication Card with Tabs
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = SurfaceElevated),
            shape = RoundedCornerShape(22.dp),
            elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(18.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                // Tab Switcher [Sign In] vs [Register]
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(12.dp))
                        .background(SurfaceVariantDark)
                        .padding(4.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(8.dp))
                            .background(if (!isRegisterMode) EmeraldPrimary else Color.Transparent)
                            .clickable {
                                isRegisterMode = false
                            }
                            .padding(vertical = 10.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = if (isTamil) "உள்நுழை (Sign In)" else "Sign In",
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold,
                            color = if (!isRegisterMode) Color.Black else TextSecondaryDark
                        )
                    }
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(8.dp))
                            .background(if (isRegisterMode) EmeraldPrimary else Color.Transparent)
                            .clickable {
                                isRegisterMode = true
                            }
                            .padding(vertical = 10.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = if (isTamil) "பதிவு செய் (Register)" else "Register",
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold,
                            color = if (isRegisterMode) Color.Black else TextSecondaryDark
                        )
                    }
                }

                if (!isRegisterMode) {
                    // ---------------- SIGN IN FORM ----------------
                    Text(
                        text = if (isTamil) "கணக்கில் உள்நுழையவும்" else "Sign In to Homoeo Care",
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )

                    OutlinedTextField(
                        value = loginIdentifier,
                        onValueChange = { loginIdentifier = it },
                        label = { Text(if (isTamil) "கைபேசி எண் அல்லது மின்னஞ்சல் *" else "Mobile Number or Email *") },
                        placeholder = { Text("+91 98765 43210 or email") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        leadingIcon = { Icon(Icons.Default.Phone, null, tint = TextSecondaryDark) },
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = EmeraldPrimary,
                            unfocusedBorderColor = SurfaceVariantDark,
                            focusedTextColor = Color.White,
                            unfocusedTextColor = Color.White
                        )
                    )

                    OutlinedTextField(
                        value = loginPassword,
                        onValueChange = { loginPassword = it },
                        label = { Text(if (isTamil) "கடவுச்சொல்" else "Password") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        visualTransformation = PasswordVisualTransformation(),
                        leadingIcon = { Icon(Icons.Default.Lock, null, tint = TextSecondaryDark) },
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = EmeraldPrimary,
                            unfocusedBorderColor = SurfaceVariantDark,
                            focusedTextColor = Color.White,
                            unfocusedTextColor = Color.White
                        )
                    )

                    Button(
                        onClick = {
                            if (loginIdentifier.isBlank() || loginPassword.isBlank()) {
                                Toast.makeText(
                                    context,
                                    if (isTamil) "கைபேசி எண் மற்றும் கடவுச்சொல் உள்ளிடவும்" else "Please enter your Mobile/Email and Password",
                                    Toast.LENGTH_SHORT
                                ).show()
                            } else {
                                isLoggingIn = true
                                coroutineScope.launch {
                                    kotlinx.coroutines.delay(450)
                                    val cleanInput = loginIdentifier.trim()
                                    val role = "patient"
                                    val name = if (cleanInput.contains("@")) {
                                        cleanInput.substringBefore("@").replace(".", " ")
                                            .split(" ")
                                            .joinToString(" ") { it.replaceFirstChar { c -> c.uppercase() } }
                                    } else {
                                        "Patient " + cleanInput.takeLast(4)
                                    }
                                    Toast.makeText(
                                        context,
                                        if (isTamil) "உள்நுழைவு வெற்றிகரமானது!" else "Signed in successfully!",
                                        Toast.LENGTH_SHORT
                                    ).show()
                                    isLoggingIn = false
                                    onAuthenticated(UserSession(name, cleanInput, role = role))
                                }
                            }
                        },
                        enabled = !isLoggingIn,
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(48.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary),
                        shape = RoundedCornerShape(14.dp)
                    ) {
                        if (isLoggingIn) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(18.dp),
                                color = Color.Black,
                                strokeWidth = 2.dp
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = if (isTamil) "உள்நுழைகிறது..." else "Signing in...",
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color.Black
                            )
                        } else {
                            Text(
                                text = if (isTamil) "கடவுச்சொல் மூலம் உள்நுழைக" else "Sign In with Password",
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color.Black
                            )
                        }
                    }
                } else {
                    // ---------------- REGISTER FORM ----------------
                    Text(
                        text = if (isTamil) "புதிய நோயாளி பதிவு" else "New Patient Registration",
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )

                        OutlinedTextField(
                            value = regName,
                            onValueChange = { regName = it },
                            label = { Text(if (isTamil) "முழுப் பெயர் *" else "Full Name *") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true,
                            leadingIcon = { Icon(Icons.Default.Person, null, tint = TextSecondaryDark) },
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = EmeraldPrimary,
                                unfocusedBorderColor = SurfaceVariantDark,
                                focusedTextColor = Color.White,
                                unfocusedTextColor = Color.White
                            )
                        )

                        OutlinedTextField(
                            value = regPhone,
                            onValueChange = { regPhone = it },
                            label = { Text(if (isTamil) "கைபேசி எண் (+91) *" else "Mobile Number (+91) *") },
                            placeholder = { Text("98765 43210") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true,
                            leadingIcon = { Icon(Icons.Default.Phone, null, tint = TextSecondaryDark) },
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = EmeraldPrimary,
                                unfocusedBorderColor = SurfaceVariantDark,
                                focusedTextColor = Color.White,
                                unfocusedTextColor = Color.White
                            )
                        )

                        OutlinedTextField(
                            value = regEmail,
                            onValueChange = { regEmail = it },
                            label = { Text(if (isTamil) "மின்னஞ்சல் முகவரி (விருப்பம்)" else "Email Address (Optional)") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true,
                            leadingIcon = { Icon(Icons.Default.Email, null, tint = TextSecondaryDark) },
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = EmeraldPrimary,
                                unfocusedBorderColor = SurfaceVariantDark,
                                focusedTextColor = Color.White,
                                unfocusedTextColor = Color.White
                            )
                        )

                        OutlinedTextField(
                            value = regPassword,
                            onValueChange = { regPassword = it },
                            label = { Text(if (isTamil) "கடவுச்சொல் உருவாக்கு *" else "Create Password *") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true,
                            visualTransformation = PasswordVisualTransformation(),
                            leadingIcon = { Icon(Icons.Default.Lock, null, tint = TextSecondaryDark) },
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = EmeraldPrimary,
                                unfocusedBorderColor = SurfaceVariantDark,
                                focusedTextColor = Color.White,
                                unfocusedTextColor = Color.White
                            )
                        )

                        Button(
                            onClick = {
                                if (regName.isBlank() || regPhone.length < 10 || regPassword.isBlank()) {
                                    Toast.makeText(
                                        context,
                                        if (isTamil) "பெயர், சரியான கைபேசி எண் மற்றும் கடவுச்சொல் கட்டாயம்" else "Please enter your Name, valid Mobile Number, and Password",
                                        Toast.LENGTH_SHORT
                                    ).show()
                                } else {
                                    isRegistering = true
                                    coroutineScope.launch {
                                        kotlinx.coroutines.delay(600)
                                        val cleanPhone = if (regPhone.startsWith("+91")) regPhone else "+91${regPhone.takeLast(10)}"
                                        val newUser = UserSession(
                                            name = regName.trim(),
                                            phone = cleanPhone,
                                            email = regEmail.trim(),
                                            role = "patient"
                                        )
                                        Toast.makeText(
                                            context,
                                            if (isTamil) "பதிவு வெற்றிகரமானது! ஸ்ரீ ஹோமியோ கேருக்கு நல்வரவு." else "Registration successful! Welcome to Sri Homoeo Care",
                                            Toast.LENGTH_SHORT
                                        ).show()
                                        isRegistering = false
                                        onAuthenticated(newUser)
                                    }
                                }
                            },
                            enabled = !isRegistering,
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(50.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary),
                            shape = RoundedCornerShape(14.dp)
                        ) {
                            if (isRegistering) {
                                CircularProgressIndicator(
                                    modifier = Modifier.size(20.dp),
                                    color = Color.Black,
                                    strokeWidth = 2.dp
                                )
                                Spacer(modifier = Modifier.width(10.dp))
                                Text(
                                    text = if (isTamil) "பதிவு செய்யப்படுகிறது..." else "Registering…",
                                    fontSize = 15.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color.Black
                                )
                            } else {
                                Text(
                                    text = if (isTamil) "பதிவு செய்க" else "Register",
                                    fontSize = 15.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color.Black
                                )
                            }
                        }
                    }
                }
            }
        }
    }

// -------------------------------------------------------------
// PATIENT AUTHENTICATED HOME SCREEN
// -------------------------------------------------------------
@Composable
fun PatientHomeScreen(
    isTamil: Boolean,
    user: UserSession,
    booking: AppointmentData,
    onNavigate: (ClinicTab) -> Unit,
    onCallClinic: () -> Unit
) {
    val scrollState = rememberScrollState()
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(scrollState)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Welcome Patient Greeting Card
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = SurfaceElevated),
            shape = RoundedCornerShape(22.dp),
            elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = if (isTamil) "வணக்கம், ${user.name}!" else "Welcome back, ${user.name}!",
                            fontSize = 19.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                        Text(
                            text = "${user.phone} • ${if (isTamil) "பதிவு செய்யப்பட்ட நோயாளி" else "Registered Patient"}",
                            fontSize = 12.sp,
                            color = EmeraldPrimary
                        )
                    }
                    Surface(
                        color = EmeraldDark.copy(alpha = 0.3f),
                        shape = CircleShape,
                        border = androidx.compose.foundation.BorderStroke(1.dp, EmeraldPrimary)
                    ) {
                        Text(
                            text = if (isTamil) "செயலில் உள்ள நோயாளி" else "Active Patient",
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                            fontSize = 10.sp,
                            color = EmeraldPrimary,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
        }

        // Active Booking / Live Queue Status Banner
        if (booking.refNumber.isNotBlank()) {
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = SurfaceElevated),
                shape = RoundedCornerShape(20.dp),
                elevation = CardDefaults.cardElevation(defaultElevation = 3.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, GoldAccent.copy(alpha = 0.5f))
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(18.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = if (isTamil) "இன்றைய மாலை சந்திப்பு (Active)" else "Your Consultation",
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                        Text(
                            text = "Token #0${booking.tokenNumber}",
                            fontSize = 15.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = EmeraldPrimary
                        )
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(
                            text = "${booking.slot} · ${booking.mode}",
                            fontSize = 12.sp,
                            color = TextSecondaryDark
                        )
                        Text(
                            text = booking.refNumber,
                            fontSize = 11.sp,
                            color = GoldAccent,
                            fontFamily = androidx.compose.ui.text.font.FontFamily.Monospace
                        )
                    }

                    OutlinedButton(
                        onClick = { onNavigate(ClinicTab.TRACK) },
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.outlinedButtonColors(contentColor = EmeraldPrimary),
                        border = ButtonDefaults.outlinedButtonBorder.copy(brush = androidx.compose.ui.graphics.SolidColor(EmeraldPrimary))
                    ) {
                        Icon(Icons.Default.CheckCircle, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(if (isTamil) "நேரலை டோக்கன் நிலையை கண்காணிக்கவும்" else "View Live Token Progress")
                    }
                }
            }
        } else {
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = SurfaceElevated),
                shape = RoundedCornerShape(20.dp),
                elevation = CardDefaults.cardElevation(defaultElevation = 3.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, EmeraldPrimary.copy(alpha = 0.35f))
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(18.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Text(
                        text = if (isTamil) "மருத்துவ ஆலோசனை முன்பதிவு" else "Online Homeopathic Consultation",
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                    Text(
                        text = if (isTamil) "தினசரி மாலை 6:00 - 8:00 மணி வரை 15 நிமிட நேரடி WhatsApp ஆலோசனைகள்." else "15-Minute focused evening consultations (6:00 - 8:00 PM IST) with Dr. Sriindhuja C.",
                        fontSize = 12.sp,
                        color = TextSecondaryDark
                    )
                    Button(
                        onClick = { onNavigate(ClinicTab.BOOK) },
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Text(
                            text = if (isTamil) "புதிய சந்திப்பு பதிவு செய்க" else "Book Consultation",
                            color = Color.Black,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
        }

        // Bento-style quick actions (dark.design / bentogrids inspired)
        Text(
            text = if (isTamil) "விரைவு செயல்கள்" else "Quick actions",
            fontSize = 12.sp,
            fontWeight = FontWeight.SemiBold,
            color = TextSecondaryDark,
            letterSpacing = 0.8.sp
        )
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Card(
                onClick = { onNavigate(ClinicTab.BOOK) },
                modifier = Modifier.weight(1f),
                colors = CardDefaults.cardColors(containerColor = SurfaceElevated),
                shape = RoundedCornerShape(18.dp),
                elevation = CardDefaults.cardElevation(defaultElevation = 3.dp)
            ) {
                Column(
                    modifier = Modifier.padding(14.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Surface(
                        shape = RoundedCornerShape(12.dp),
                        color = EmeraldPrimary.copy(alpha = 0.15f),
                        modifier = Modifier.size(40.dp)
                    ) {
                        Box(contentAlignment = Alignment.Center, modifier = Modifier.fillMaxSize()) {
                            Icon(Icons.Default.DateRange, null, tint = EmeraldPrimary, modifier = Modifier.size(20.dp))
                        }
                    }
                    Text(
                        text = if (isTamil) "முன்பதிவு" else "Book slot",
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                    Text(
                        text = if (isTamil) "மாலை 6–8 · ஆன்லைன்" else "Eve 6–8 PM · Online",
                        fontSize = 11.sp,
                        color = TextSecondaryDark
                    )
                }
            }
            Card(
                onClick = { onNavigate(ClinicTab.TRACK) },
                modifier = Modifier.weight(1f),
                colors = CardDefaults.cardColors(containerColor = SurfaceElevated),
                shape = RoundedCornerShape(18.dp),
                elevation = CardDefaults.cardElevation(defaultElevation = 3.dp)
            ) {
                Column(
                    modifier = Modifier.padding(14.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Surface(
                        shape = RoundedCornerShape(12.dp),
                        color = GoldAccent.copy(alpha = 0.15f),
                        modifier = Modifier.size(40.dp)
                    ) {
                        Box(contentAlignment = Alignment.Center, modifier = Modifier.fillMaxSize()) {
                            Icon(Icons.Default.CheckCircle, null, tint = GoldAccent, modifier = Modifier.size(20.dp))
                        }
                    }
                    Text(
                        text = if (isTamil) "டோக்கன்" else "Live queue",
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                    Text(
                        text = if (isTamil) "5-நிலை கண்காணிப்பு" else "5-stage tracker",
                        fontSize = 11.sp,
                        color = TextSecondaryDark
                    )
                }
            }
        }
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Card(
                onClick = { onNavigate(ClinicTab.PRESCRIPTION) },
                modifier = Modifier.weight(1f),
                colors = CardDefaults.cardColors(containerColor = SurfaceElevated),
                shape = RoundedCornerShape(18.dp),
                elevation = CardDefaults.cardElevation(defaultElevation = 3.dp)
            ) {
                Column(
                    modifier = Modifier.padding(14.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Surface(
                        shape = RoundedCornerShape(12.dp),
                        color = EmeraldPrimary.copy(alpha = 0.12f),
                        modifier = Modifier.size(40.dp)
                    ) {
                        Box(contentAlignment = Alignment.Center, modifier = Modifier.fillMaxSize()) {
                            Icon(Icons.Default.MedicalServices, null, tint = EmeraldPrimary, modifier = Modifier.size(20.dp))
                        }
                    }
                    Text(
                        text = if (isTamil) "மருந்து" else "Rx vault",
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                    Text(
                        text = if (isTamil) "சீட்டு & உணவு" else "Scripts & diet",
                        fontSize = 11.sp,
                        color = TextSecondaryDark
                    )
                }
            }
            Card(
                onClick = { onNavigate(ClinicTab.DOCTOR) },
                modifier = Modifier.weight(1f),
                colors = CardDefaults.cardColors(containerColor = SurfaceElevated),
                shape = RoundedCornerShape(18.dp),
                elevation = CardDefaults.cardElevation(defaultElevation = 3.dp)
            ) {
                Column(
                    modifier = Modifier.padding(14.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Surface(
                        shape = RoundedCornerShape(12.dp),
                        color = GoldAccent.copy(alpha = 0.12f),
                        modifier = Modifier.size(40.dp)
                    ) {
                        Box(contentAlignment = Alignment.Center, modifier = Modifier.fillMaxSize()) {
                            Icon(Icons.Default.Person, null, tint = GoldAccent, modifier = Modifier.size(20.dp))
                        }
                    }
                    Text(
                        text = if (isTamil) "மருத்துவர்" else "Doctor",
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                    Text(
                        text = "Dr. Sriindhuja C",
                        fontSize = 11.sp,
                        color = TextSecondaryDark
                    )
                }
            }
        }

        // Primary CTA still prominent
        Button(
            onClick = { onNavigate(ClinicTab.BOOK) },
            modifier = Modifier
                .fillMaxWidth()
                .height(52.dp),
            colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary),
            shape = RoundedCornerShape(16.dp)
        ) {
            Icon(Icons.Default.DateRange, contentDescription = null, tint = Color.Black)
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                text = if (isTamil) "மாலை ஆலோசனை முன்பதிவு" else "Book evening consultation",
                fontSize = 14.sp,
                fontWeight = FontWeight.Bold,
                color = Color.Black
            )
        }

        // Quick Call Card
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .clickable { onCallClinic() },
            colors = CardDefaults.cardColors(containerColor = SurfaceElevated),
            shape = RoundedCornerShape(14.dp)
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Surface(
                    shape = CircleShape,
                    color = EmeraldDark.copy(alpha = 0.4f),
                    modifier = Modifier.size(46.dp)
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Icon(Icons.Default.Phone, contentDescription = "Call", tint = EmeraldPrimary)
                    }
                }
                Spacer(modifier = Modifier.width(14.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = if (isTamil) "மருத்துவமனை நேரடி உதவி" else "Homoeo Care Direct Helpline",
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                    Text(
                        text = "+91 97914 26526 · Tirupattur, TN",
                        fontSize = 12.sp,
                        color = TextSecondaryDark
                    )
                }
                Icon(Icons.Default.ArrowForward, contentDescription = null, tint = EmeraldPrimary)
            }
        }
    }
}

// -------------------------------------------------------------
// DOCTOR DESK SCREEN
// -------------------------------------------------------------
@Composable
fun DoctorDeskScreen(
    isTamil: Boolean,
    doctorName: String,
    onSignOut: () -> Unit
) {
    val scrollState = rememberScrollState()
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(scrollState)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = SurfaceElevated),
            shape = RoundedCornerShape(20.dp),
            elevation = CardDefaults.cardElevation(defaultElevation = 3.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Text(
                    text = "🩺 $doctorName",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )
                Text(
                    text = if (isTamil) "மருத்துவர் ஆலோசனை மேசை (Doctor Desk)" else "Doctor Consultation Queue",
                    fontSize = 12.sp,
                    color = EmeraldPrimary
                )
            }
        }

        Text(
            text = if (isTamil) "இன்றைய வரிசை (Today's Queue)" else "Today's Patient Queue",
            fontSize = 15.sp,
            fontWeight = FontWeight.Bold,
            color = Color.White
        )

        listOf(
            Triple("#01", "Karthik R. (34, M)", "6:00 PM · WhatsApp Call"),
            Triple("#02", "Meenakshi S. (42, F)", "6:15 PM · WhatsApp Call"),
            Triple("#03", "Anand K. (28, M)", "6:30 PM · WhatsApp Call")
        ).forEach { (token, patient, slot) ->
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = SurfaceElevated),
                shape = RoundedCornerShape(14.dp)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(14.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(text = "$token - $patient", fontWeight = FontWeight.Bold, color = Color.White)
                        Text(text = slot, fontSize = 11.sp, color = TextSecondaryDark)
                    }
                    Button(
                        onClick = {},
                        colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text("Call", color = Color.Black, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                    }
                }
            }
        }
    }
}

// -------------------------------------------------------------
// MEMBER DESK SCREEN (RAPID INTAKE WITH OPTIONAL SYMPTOMS)
// -------------------------------------------------------------
@Composable
fun MemberDeskScreen(
    isTamil: Boolean,
    memberName: String,
    onSignOut: () -> Unit
) {
    val scrollState = rememberScrollState()
    var patientName by remember { mutableStateOf("") }
    var patientPhone by remember { mutableStateOf("") }
    var symptoms by remember { mutableStateOf("") }
    val context = LocalContext.current

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(scrollState)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = SurfaceElevated),
            shape = RoundedCornerShape(20.dp),
            elevation = CardDefaults.cardElevation(defaultElevation = 3.dp)
        ) {
            Column(modifier = Modifier.padding(18.dp)) {
                Text(
                    text = "📋 $memberName",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )
                Text(
                    text = if (isTamil) "உறுப்பினர் செயல்பாட்டு மேசை (Onboard Patients)" else "Member Operations Desk",
                    fontSize = 12.sp,
                    color = EmeraldPrimary
                )
            }
        }

        Text(
            text = if (isTamil) "புதிய நோயாளி விரைவு சேர்க்கை" else "Onboard Calling Patient",
            fontSize = 15.sp,
            fontWeight = FontWeight.Bold,
            color = Color.White
        )

        OutlinedTextField(
            value = patientName,
            onValueChange = { patientName = it },
            label = { Text("Patient Full Name *") },
            modifier = Modifier.fillMaxWidth(),
            singleLine = true,
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = EmeraldPrimary,
                unfocusedBorderColor = SurfaceVariantDark,
                focusedTextColor = Color.White,
                unfocusedTextColor = Color.White
            )
        )

        OutlinedTextField(
            value = patientPhone,
            onValueChange = { patientPhone = it },
            label = { Text("Mobile Number (+91) *") },
            modifier = Modifier.fillMaxWidth(),
            singleLine = true,
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = EmeraldPrimary,
                unfocusedBorderColor = SurfaceVariantDark,
                focusedTextColor = Color.White,
                unfocusedTextColor = Color.White
            )
        )

        OutlinedTextField(
            value = symptoms,
            onValueChange = { symptoms = it },
            label = { Text("Chief symptoms / concern (Optional)") },
            modifier = Modifier.fillMaxWidth(),
            singleLine = true,
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = EmeraldPrimary,
                unfocusedBorderColor = SurfaceVariantDark,
                focusedTextColor = Color.White,
                unfocusedTextColor = Color.White
            )
        )

        Button(
            onClick = {
                if (patientName.isBlank() || patientPhone.length < 10) {
                    Toast.makeText(context, "Name and Phone are mandatory", Toast.LENGTH_SHORT).show()
                } else {
                    Toast.makeText(context, "Patient Account Created! Login: $patientPhone", Toast.LENGTH_LONG).show()
                    patientName = ""
                    patientPhone = ""
                    symptoms = ""
                }
            },
            modifier = Modifier
                .fillMaxWidth()
                .height(50.dp),
            colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary),
            shape = RoundedCornerShape(14.dp)
        ) {
            Text("Create Patient Account & Book", color = Color.Black, fontWeight = FontWeight.Bold)
        }
    }
}

// -------------------------------------------------------------
// ADMIN CONSOLE SCREEN
// -------------------------------------------------------------
@Composable
fun AdminConsoleScreen(
    isTamil: Boolean,
    onSignOut: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = SurfaceElevated),
            shape = RoundedCornerShape(20.dp),
            elevation = CardDefaults.cardElevation(defaultElevation = 3.dp)
        ) {
            Column(modifier = Modifier.padding(18.dp)) {
                Text(
                    text = "👑 Homoeo Care Administrator Console",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )
                Text(
                    text = "Dr. Sriindhuja C Homoeo Healthcare Network",
                    fontSize = 12.sp,
                    color = GoldAccent
                )
            }
        }

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            InfoChip(modifier = Modifier.weight(1f), title = "Total Patients", value = "1,420+", icon = Icons.Default.Person)
            InfoChip(modifier = Modifier.weight(1f), title = "Today Consults", value = "8 Slots", icon = Icons.Default.MedicalServices)
        }
    }
}

// -------------------------------------------------------------
// 2. BOOKING SCREEN
// -------------------------------------------------------------
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BookingScreen(
    isTamil: Boolean,
    prefillName: String = "",
    prefillPhone: String = "",
    onBookingConfirmed: (AppointmentData) -> Unit
) {
    val context = LocalContext.current
    var selectedMode by remember { mutableStateOf("Online WhatsApp Call") }
    var patientName by remember { mutableStateOf(prefillName) }
    var patientAge by remember { mutableStateOf("32") }
    var mobileNumber by remember { mutableStateOf(prefillPhone) }
    var symptoms by remember { mutableStateOf("") }
    var selectedSlot by remember { mutableStateOf("6:30 p.m. IST") }

    val slots = listOf(
        "6:00 p.m.", "6:15 p.m.", "6:30 p.m.", "6:45 p.m.",
        "7:00 p.m.", "7:15 p.m.", "7:30 p.m.", "7:45 p.m."
    )

    val scrollState = rememberScrollState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(scrollState)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        Text(
            text = if (isTamil) "ஆன்லைன் ஆலோசனை முன்பதிவு" else "Book Online Consultation",
            fontSize = 20.sp,
            fontWeight = FontWeight.Bold,
            color = Color.White
        )
        Text(
            text = if (isTamil)
                "மாலை 6:00 - 8:00 IST ஆலோசனையை தேர்ந்தெடுக்கவும் (நேரடி வருகை விரைவில் வரும்)"
            else
                "Select evening slot (6:00 - 8:00 p.m. IST) · In-Clinic Coming Soon",
            fontSize = 13.sp,
            color = TextSecondaryDark
        )

        // Consultation Mode Switcher
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            FilterChip(
                modifier = Modifier.weight(1f),
                selected = selectedMode == "Online WhatsApp Call",
                onClick = { selectedMode = "Online WhatsApp Call" },
                label = { Text(if (isTamil) "WhatsApp ஆன்லைன் (தயார்)" else "Online WhatsApp (Active)", textAlign = TextAlign.Center, modifier = Modifier.fillMaxWidth()) },
                leadingIcon = { Icon(Icons.Default.Phone, contentDescription = null) },
                colors = FilterChipDefaults.filterChipColors(
                    selectedContainerColor = EmeraldPrimary,
                    selectedLabelColor = Color.Black,
                    selectedLeadingIconColor = Color.Black
                )
            )
            FilterChip(
                modifier = Modifier.weight(1f),
                selected = selectedMode == "In-Clinic Visit",
                onClick = {
                    Toast.makeText(context, if (isTamil) "நேரடி சிகிச்சை விரைவில் வரவுள்ளது" else "In-Clinic consultations are coming soon!", Toast.LENGTH_SHORT).show()
                },
                label = { Text(if (isTamil) "நேரடி வருகை (விரைவில்)" else "In-Clinic (Coming Soon)", textAlign = TextAlign.Center, modifier = Modifier.fillMaxWidth()) },
                leadingIcon = { Icon(Icons.Default.LocationOn, contentDescription = null) },
                colors = FilterChipDefaults.filterChipColors(
                    selectedContainerColor = SurfaceVariantDark,
                    selectedLabelColor = TextSecondaryDark,
                    selectedLeadingIconColor = TextSecondaryDark
                )
            )
        }

        // Input Form
        OutlinedTextField(
            value = patientName,
            onValueChange = { patientName = it },
            label = { Text(if (isTamil) "நோயாளி பெயர் *" else "Patient Full Name *") },
            modifier = Modifier.fillMaxWidth(),
            singleLine = true,
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = EmeraldPrimary,
                unfocusedBorderColor = SurfaceVariantDark,
                focusedTextColor = Color.White,
                unfocusedTextColor = Color.White
            )
        )

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            OutlinedTextField(
                value = patientAge,
                onValueChange = { patientAge = it },
                label = { Text(if (isTamil) "வயது *" else "Age *") },
                modifier = Modifier.weight(0.8f),
                singleLine = true,
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = EmeraldPrimary,
                    unfocusedBorderColor = SurfaceVariantDark,
                    focusedTextColor = Color.White,
                    unfocusedTextColor = Color.White
                )
            )
            OutlinedTextField(
                value = mobileNumber,
                onValueChange = { mobileNumber = it },
                label = { Text(if (isTamil) "கைபேசி எண் *" else "Mobile Number *") },
                modifier = Modifier.weight(1.2f),
                singleLine = true,
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = EmeraldPrimary,
                    unfocusedBorderColor = SurfaceVariantDark,
                    focusedTextColor = Color.White,
                    unfocusedTextColor = Color.White
                )
            )
        }

        // Symptoms Field - STRICTLY OPTIONAL
        OutlinedTextField(
            value = symptoms,
            onValueChange = { symptoms = it },
            label = { Text(if (isTamil) "குறை அல்லது அறிகுறிகள் (விருப்பம்)" else "Chief Concern / Symptoms (Optional)") },
            placeholder = { Text(if (isTamil) "எ.கா. ஒற்றைத் தலைவலி, தடிப்பு (விருப்பம்)" else "e.g. Migraine, Skin issue (Optional)") },
            modifier = Modifier.fillMaxWidth(),
            maxLines = 3,
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = EmeraldPrimary,
                unfocusedBorderColor = SurfaceVariantDark,
                focusedTextColor = Color.White,
                unfocusedTextColor = Color.White
            )
        )

        // Slot Selector
        Text(
            text = if (isTamil) "மாலை நேரத்தை தேர்ந்தெடுக்கவும் (6:00 - 8:00 IST)" else "Choose Evening Slot (6:00 - 8:00 p.m. IST)",
            fontSize = 14.sp,
            fontWeight = FontWeight.SemiBold,
            color = Color.White
        )

        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            slots.chunked(4).forEach { rowSlots ->
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    rowSlots.forEach { slot ->
                        val isSelected = selectedSlot == "$slot IST"
                        Surface(
                            modifier = Modifier
                                .weight(1f)
                                .clickable { selectedSlot = "$slot IST" },
                            shape = RoundedCornerShape(8.dp),
                            color = if (isSelected) EmeraldPrimary else SurfaceDark,
                            border = androidx.compose.foundation.BorderStroke(
                                1.dp,
                                if (isSelected) EmeraldPrimary else SurfaceVariantDark
                            )
                        ) {
                            Text(
                                text = slot,
                                modifier = Modifier.padding(vertical = 10.dp),
                                textAlign = TextAlign.Center,
                                fontSize = 12.sp,
                                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
                                color = if (isSelected) Color.Black else Color.White
                            )
                        }
                    }
                }
            }
        }

        Button(
            onClick = {
                if (patientName.isBlank() || mobileNumber.isBlank()) {
                    Toast.makeText(
                        context,
                        if (isTamil) "பெயர் மற்றும் தொலைபேசி எண் கட்டாயம்" else "Please enter your Name and Mobile Number",
                        Toast.LENGTH_SHORT
                    ).show()
                } else {
                    val randToken = (1..15).random()
                    val randId = "SHC-2026-" + java.util.UUID.randomUUID().toString().substring(0, 6).uppercase()
                    val newBooking = AppointmentData(
                        refNumber = randId,
                        patientName = patientName,
                        mode = selectedMode,
                        date = "Today",
                        slot = selectedSlot,
                        tokenNumber = randToken,
                        stage = 2
                    )
                    Toast.makeText(
                        context,
                        if (isTamil) "முன்பதிவு உறுதியானது! டோக்கன் #0$randToken" else "Appointment confirmed! Token #0$randToken",
                        Toast.LENGTH_LONG
                    ).show()
                    onBookingConfirmed(newBooking)
                }
            },
            modifier = Modifier
                .fillMaxWidth()
                .height(54.dp),
            colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary),
            shape = RoundedCornerShape(14.dp)
        ) {
            Icon(Icons.Default.Check, contentDescription = null, tint = Color.Black)
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                text = if (isTamil) "சந்திப்பை உறுதிசெய்க" else "Confirm & Book Consultation",
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold,
                color = Color.Black
            )
        }
    }
}

// -------------------------------------------------------------
// 3. TRACKER SCREEN (5-STAGE PROGRESSION)
// -------------------------------------------------------------
@Composable
fun TrackerScreen(
    isTamil: Boolean,
    booking: AppointmentData,
    onAdvanceStage: () -> Unit
) {
    val scrollState = rememberScrollState()

    val stages = listOf(
        Pair("1. Request Submitted", "கோரிக்கை பெறப்பட்டது"),
        Pair("2. Confirmed by Dr. Sriindhuja", "மருத்துவர் உறுதிப்படுத்தினார்"),
        Pair("3. In Waiting Room / Token Called", "அழைப்பு / காத்திருப்பு அறை"),
        Pair("4. WhatsApp Call In Progress", "WhatsApp ஆலோசனை நடைபெறுகிறது"),
        Pair("5. Prescription Ready", "மருந்து சீட்டு தயார்")
    )

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(scrollState)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text(
            text = if (isTamil) "நேரடி நிலை கண்காணிப்பான்" else "5-Stage Live Status Tracker",
            fontSize = 20.sp,
            fontWeight = FontWeight.Bold,
            color = Color.White
        )

        if (booking.refNumber.isBlank()) {
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = SurfaceElevated),
                shape = RoundedCornerShape(20.dp),
                elevation = CardDefaults.cardElevation(defaultElevation = 3.dp)
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Text(
                        text = if (isTamil) "கண்காணிக்க சந்திப்பு எதுவும் இல்லை" else "No Active Appointment",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                    Text(
                        text = if (isTamil) "சந்திப்பு நிலையை கண்காணிக்க புதிய சந்திப்பை முன்பதிவு செய்யவும்." else "Book an evening consultation to track your live queue and consultation status here.",
                        fontSize = 13.sp,
                        color = TextSecondaryDark,
                        textAlign = androidx.compose.ui.text.style.TextAlign.Center
                    )
                }
            }
        } else {
            // Token Info Banner
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = SurfaceElevated),
                shape = RoundedCornerShape(20.dp),
                elevation = CardDefaults.cardElevation(defaultElevation = 3.dp)
            ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = if (isTamil) "உங்கள் டோக்கன்" else "Your Token",
                        fontSize = 12.sp,
                        color = TextSecondaryDark
                    )
                    Text(
                        text = "#0${booking.tokenNumber}",
                        fontSize = 32.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = EmeraldPrimary
                    )
                    Text(
                        text = booking.refNumber,
                        fontSize = 12.sp,
                        color = GoldAccent
                    )
                }
                Column(horizontalAlignment = Alignment.End) {
                    Text(
                        text = if (isTamil) "தற்போது பரிசோதிப்பது" else "Now Serving",
                        fontSize = 12.sp,
                        color = TextSecondaryDark
                    )
                    Text(
                        text = "#03",
                        fontSize = 24.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                    Text(
                        text = "${booking.slot} · ${booking.mode}",
                        fontSize = 11.sp,
                        color = TextSecondaryDark
                    )
                }
            }
        }

        // Stepper
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = SurfaceElevated),
            shape = RoundedCornerShape(20.dp),
            elevation = CardDefaults.cardElevation(defaultElevation = 3.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(18.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                stages.forEachIndexed { index, (enText, taText) ->
                    val stageNum = index + 1
                    val isDone = stageNum < booking.stage
                    val isCurrent = stageNum == booking.stage

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Surface(
                            shape = CircleShape,
                            color = when {
                                isDone -> EmeraldPrimary
                                isCurrent -> GoldAccent
                                else -> SurfaceVariantDark
                            },
                            modifier = Modifier.size(34.dp)
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                if (isDone) {
                                    Icon(Icons.Default.Check, contentDescription = null, tint = Color.Black, modifier = Modifier.size(18.dp))
                                } else {
                                    Text(
                                        text = "$stageNum",
                                        fontWeight = FontWeight.Bold,
                                        color = if (isCurrent) Color.Black else TextSecondaryDark,
                                        fontSize = 13.sp
                                    )
                                }
                            }
                        }
                        Spacer(modifier = Modifier.width(14.dp))
                        Column {
                            Text(
                                text = if (isTamil) taText else enText,
                                fontSize = 13.sp,
                                fontWeight = if (isCurrent) FontWeight.Bold else FontWeight.Medium,
                                color = if (isCurrent) Color.White else if (isDone) EmeraldPrimary else TextSecondaryDark
                            )
                            if (isCurrent) {
                                Text(
                                    text = if (isTamil) "● தற்போதைய நிலை" else "● Active Current Stage",
                                    fontSize = 11.sp,
                                    color = GoldAccent,
                                    fontWeight = FontWeight.SemiBold
                                )
                            }
                        }
                    }
                }
            }

            // Stage Progression Controls
            OutlinedButton(
                onClick = onAdvanceStage,
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.outlinedButtonColors(contentColor = EmeraldPrimary),
                border = ButtonDefaults.outlinedButtonBorder.copy(brush = androidx.compose.ui.graphics.SolidColor(EmeraldPrimary))
            ) {
                Icon(Icons.Default.PlayArrow, contentDescription = null)
                Spacer(modifier = Modifier.width(8.dp))
                Text(if (isTamil) "அடுத்த நிலைக்கு மாற்று" else "Advance Live Stage")
            }
        }
    }
}
}

// -------------------------------------------------------------
// 4. PRESCRIPTION & DIET SCREEN (OPTION C DUAL CARE)
// -------------------------------------------------------------
@Composable
fun PrescriptionScreen(
    isTamil: Boolean,
    booking: AppointmentData
) {
    val scrollState = rememberScrollState()
    val context = LocalContext.current

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(scrollState)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text(
            text = if (isTamil) "மருந்து சீட்டு & உணவு முறை" else "Prescription & Dietary Care",
            fontSize = 20.sp,
            fontWeight = FontWeight.Bold,
            color = Color.White
        )

        if (booking.refNumber.isBlank()) {
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = SurfaceElevated),
                shape = RoundedCornerShape(20.dp),
                elevation = CardDefaults.cardElevation(defaultElevation = 3.dp)
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Text(
                        text = if (isTamil) "செயலில் உள்ள மருந்து சீட்டு இல்லை" else "No Active Prescription",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                    Text(
                        text = if (isTamil) "மருத்துவர் ஸ்ரீஇந்துஜா அவர்களின் ஆலோசனை முடிந்ததும் உங்கள் தனிப்பயன் மருந்துச் சீட்டு இங்கு காண்பிக்கப்படும்." else "Your digital prescription will appear here once your consultation with Dr. Sriindhuja C is completed.",
                        fontSize = 13.sp,
                        color = TextSecondaryDark,
                        textAlign = androidx.compose.ui.text.style.TextAlign.Center
                    )
                }
            }
        } else {
            // Prescription Card
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = SurfaceElevated),
                shape = RoundedCornerShape(20.dp),
                elevation = CardDefaults.cardElevation(defaultElevation = 3.dp)
            ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Column {
                        Text(
                            text = "Dr. Sriindhuja C",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                        Text(
                            text = "BHMS, MSc (Psychology) · Reg. 5397",
                            fontSize = 12.sp,
                            color = EmeraldPrimary
                        )
                    }
                    Surface(
                        color = SurfaceVariantDark,
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text(
                            text = booking.refNumber,
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                            fontSize = 11.sp,
                            color = GoldAccent
                        )
                    }
                }

                HorizontalDivider(color = SurfaceVariantDark)

                Text(
                    text = "${if (isTamil) "நோயாளி" else "Patient"}: ${booking.patientName} (${booking.mode})",
                    fontSize = 14.sp,
                    color = Color.White,
                    fontWeight = FontWeight.Medium
                )

                // Prescribed Homoeopathic Remedies
                MedicineItem(
                    name = "Thuja Occidentalis 30CH",
                    instructions = if (isTamil) "3 இனிப்பு உருண்டைகள், உணவுக்கு முன், தினமும் 2 முறை" else "3 sweet globules dry on tongue, twice daily before meals"
                )
                MedicineItem(
                    name = "Arnica Montana 200CH",
                    instructions = if (isTamil) "3 இனிப்பு உருண்டைகள், இரவில் தூங்கும் முன்" else "3 sweet globules before sleep at night"
                )

                // Option C Medicine Delivery Selection
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = SurfaceVariantDark),
                    shape = RoundedCornerShape(14.dp)
                ) {
                    Column(
                        modifier = Modifier.padding(14.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Text(
                            text = if (isTamil) "மருந்து விநியோக முறை (Option C Dual Care)" else "Medicine Delivery Choice (Option C)",
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Button(
                                onClick = {
                                    Toast.makeText(context, if (isTamil) "PDF மருந்துச் சீட்டு பதிவிறக்கம் தயார்!" else "PDF Prescription downloaded for local pharmacy!", Toast.LENGTH_SHORT).show()
                                },
                                modifier = Modifier.weight(1f),
                                colors = ButtonDefaults.buttonColors(containerColor = SurfaceDark),
                                shape = RoundedCornerShape(8.dp)
                            ) {
                                Text(if (isTamil) "உள்ளூரில் வாங்க (PDF)" else "Buy Local (PDF)", fontSize = 11.sp, color = EmeraldPrimary)
                            }
                            Button(
                                onClick = {
                                    Toast.makeText(context, if (isTamil) "கொரியர் அனுப்பப்பட்டது! Tracking: ST-88219" else "Care Courier Dispatched! Tracking: ST-88219", Toast.LENGTH_SHORT).show()
                                },
                                modifier = Modifier.weight(1f),
                                colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary),
                                shape = RoundedCornerShape(8.dp)
                            ) {
                                Text(if (isTamil) "ஹோமியோ கேர் கொரியர்" else "Homoeo Care Courier", fontSize = 11.sp, color = Color.Black, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }
        }
    }

        // Golden Dietary Rules
        Text(
            text = if (isTamil) "ஹோமியோபதி முக்கிய உணவு கட்டுப்பாடுகள்" else "Homoeopathy Golden Dietary Rules",
            fontSize = 16.sp,
            fontWeight = FontWeight.Bold,
            color = GoldAccent
        )

        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = SurfaceElevated),
            shape = RoundedCornerShape(20.dp),
            elevation = CardDefaults.cardElevation(defaultElevation = 3.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(18.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                DietRuleItem(
                    emoji = "🚫",
                    rule = if (isTamil)
                        "மருந்து எடுப்பதற்கு 30 நிமிடங்கள் முன்/பின் காபி, பச்சை வெங்காயம், பூண்டு தவிர்க்கவும்."
                    else
                        "Avoid strong flavors (coffee, raw onion, garlic, menthol/camphor) 30 minutes before & after dose."
                )
                DietRuleItem(
                    emoji = "👅",
                    rule = if (isTamil)
                        "மருந்தை கைகளில் தொடாமல், மூடியில் கொட்டி நேரடியாக நாக்கில் கரைக்கவும்."
                    else
                        "Do not touch globules with bare fingers. Pour into bottle cap and dissolve dry on tongue."
                )
                DietRuleItem(
                    emoji = "☀️",
                    rule = if (isTamil)
                        "மருந்துகளை நேரடி வெயில், அதிக வெப்பம் படாதவாறு பாதுகாக்கவும்."
                    else
                        "Keep remedies away from direct sunlight, pungent perfumes, and electronic heat."
                )
            }
        }
    }
}

// -------------------------------------------------------------
// 5. DOCTOR & CLINIC PROFILE
// -------------------------------------------------------------
@Composable
fun DoctorScreen(
    isTamil: Boolean,
    onCallDoctor: () -> Unit
) {
    val scrollState = rememberScrollState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(scrollState)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = SurfaceElevated),
            shape = RoundedCornerShape(22.dp),
            elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Surface(
                    shape = CircleShape,
                    color = EmeraldDark.copy(alpha = 0.4f),
                    modifier = Modifier.size(80.dp),
                    border = androidx.compose.foundation.BorderStroke(2.dp, GoldAccent)
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Icon(
                            Icons.Default.Person,
                            contentDescription = "Doctor Avatar",
                            tint = EmeraldPrimary,
                            modifier = Modifier.size(48.dp)
                        )
                    }
                }
                Spacer(modifier = Modifier.height(14.dp))
                Text(
                    text = "Dr. Sriindhuja C",
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )
                Text(
                    text = "BHMS, MSc (Psychology)",
                    fontSize = 14.sp,
                    color = EmeraldPrimary,
                    fontWeight = FontWeight.SemiBold
                )
                Text(
                    text = "Regd. Homoeopathic Physician (Reg. No: 5397)",
                    fontSize = 12.sp,
                    color = GoldAccent
                )
            }
        }

        // Philosophy & Expertise
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = SurfaceElevated),
            shape = RoundedCornerShape(20.dp),
            elevation = CardDefaults.cardElevation(defaultElevation = 3.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(18.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Text(
                    text = if (isTamil) "சிகிச்சை தத்துவம்" else "Healing Philosophy",
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )
                Text(
                    text = if (isTamil)
                        "ஹோமியோபதி மற்றும் உளவியல் ஆலோசனையின் மூலம் நோயின் அறிகுறிகளை மட்டும் தற்காலிகமாக மறைக்காமல், உடலின் நோய் எதிர்ப்பு சக்தியையும் மன அமைதியையும் வேரிலிருந்து மீட்டெடுக்கும் முழுமையான சிகிச்சை முறை."
                    else
                        "Combining classical individualized homoeopathy with psychological counseling to treat chronic ailments at their foundational root rather than masking superficial symptoms. True healing begins at the core.",
                    fontSize = 13.sp,
                    color = TextSecondaryDark,
                    lineHeight = 20.sp
                )
            }
        }

        // Clinic Details
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = SurfaceElevated),
            shape = RoundedCornerShape(20.dp),
            elevation = CardDefaults.cardElevation(defaultElevation = 3.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(18.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Text(
                    text = if (isTamil) "சிகிச்சை மைய விபரம்" else "Care Center Information",
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )
                DetailRow(
                    label = if (isTamil) "முகவரி" else "Location",
                    value = "Sri Homoeo Care, Tirupattur, Tamil Nadu"
                )
                DetailRow(
                    label = if (isTamil) "நேரம்" else "Consulting Hours",
                    value = "Mon – Sun: 6:00 p.m. – 8:00 p.m. IST"
                )
                DetailRow(
                    label = if (isTamil) "அழைக்க" else "Contact Phone",
                    value = "+91 97914 26526 / +91 94437 26526"
                )
            }
        }

        Button(
            onClick = onCallDoctor,
            modifier = Modifier
                .fillMaxWidth()
                .height(52.dp),
            colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary),
            shape = RoundedCornerShape(14.dp)
        ) {
            Icon(Icons.Default.Phone, contentDescription = null, tint = Color.Black)
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                text = if (isTamil) "மருத்துவரை அழைக்கவும்" else "Call Dr. Sriindhuja C",
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold,
                color = Color.Black
            )
        }
    }
}

// -------------------------------------------------------------
// HELPER COMPONENTS
// -------------------------------------------------------------
@Composable
fun InfoChip(
    modifier: Modifier = Modifier,
    title: String,
    value: String,
    icon: ImageVector
) {
    Card(
        modifier = modifier,
        colors = CardDefaults.cardColors(containerColor = SurfaceElevated),
        shape = RoundedCornerShape(14.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            verticalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            Icon(icon, contentDescription = null, tint = EmeraldPrimary, modifier = Modifier.size(20.dp))
            Text(text = title, fontSize = 11.sp, color = TextSecondaryDark)
            Text(text = value, fontSize = 13.sp, fontWeight = FontWeight.Bold, color = Color.White)
        }
    }
}

@Composable
fun MedicineItem(name: String, instructions: String) {
    Surface(
        color = SurfaceVariantDark,
        shape = RoundedCornerShape(10.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Text(text = name, fontSize = 14.sp, fontWeight = FontWeight.Bold, color = EmeraldPrimary)
            Spacer(modifier = Modifier.height(2.dp))
            Text(text = instructions, fontSize = 12.sp, color = Color.White)
        }
    }
}

@Composable
fun DietRuleItem(emoji: String, rule: String) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.Top
    ) {
        Text(text = emoji, fontSize = 16.sp)
        Spacer(modifier = Modifier.width(10.dp))
        Text(text = rule, fontSize = 13.sp, color = TextSecondaryDark, lineHeight = 19.sp)
    }
}

@Composable
fun DetailRow(label: String, value: String) {
    Column {
        Text(text = label, fontSize = 11.sp, color = TextSecondaryDark)
        Text(text = value, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = Color.White)
    }
}

fun dialPhone(context: Context, number: String) {
    try {
        val intent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:$number"))
        context.startActivity(intent)
    } catch (e: Exception) {
        Toast.makeText(context, "Cannot open dialer: ${e.message}", Toast.LENGTH_SHORT).show()
    }
}
