const initPatientEnquiryForm = () => {
    const form = document.getElementById("patient-enquiry-form");

    if (!form) {
        return;
    }

    const locale = document.documentElement.lang.startsWith("es") ? "es" : "en";
    const isSpanish = locale === "es";

    const messages = {
        en: {
            first_name: "First name must contain only letters and be at least 2 characters",
            last_name: "Last name must contain only letters and be at least 2 characters",
            date_of_birth: "Enter a valid date of birth. Patient must be between 0 and 120 years old",
            email: "Enter a valid email address (example: name@provider.com)",
            phone: "Phone must include a country code (example: +1 305 555 0191)",
            preferred_language: "Select your preferred language",
            preferred_clinic: "Select the clinic you would like to visit",
            preferred_date: "Select a date at least 1 business day from today and no more than 60 days ahead",
            preferred_time: "Select your preferred time of day",
            service_type: "Select the type of care you are looking for",
            paediatric: "Paediatric Care is available for patients under 18. Please check the date of birth or select a different service.",
            new_patient: "Please indicate whether this is your first visit to HealthCore",
            has_insurance: "Please indicate whether you have health insurance",
            insurance_provider: "Please enter your insurance provider name",
            insurance_member_id: "Member ID must be between 6 and 20 alphanumeric characters",
            patient_id: "Patient ID must start with HC- followed by 6 letters or numbers",
            healthConcern: (remaining) => `Please describe your health concern in at least 20 characters (${remaining} characters remaining)`,
            contact_consent: "You must consent to being contacted before submitting this form",
            counter: (count) => `${count}/500 characters`,
            eveningWarning: (clinic, closes) => `Evening appointments may be limited at ${clinic} because this clinic closes at ${closes}. The front desk will confirm availability.`,
            success: [
                "Thank you for reaching out to HealthCore.",
                "We have received your enquiry. A member of our front desk team will contact you within 1 business day to confirm your appointment details and answer any questions.",
                "If you need urgent assistance, please call your preferred clinic directly using the numbers listed on our website.",
                "We look forward to caring for you."
            ]
        },
        es: {
            first_name: "El nombre debe contener solo letras y tener al menos 2 caracteres",
            last_name: "El apellido debe contener solo letras y tener al menos 2 caracteres",
            date_of_birth: "Ingresa una fecha de nacimiento válida. El paciente debe tener entre 0 y 120 años",
            email: "Ingresa un correo electrónico válido (ejemplo: nombre@proveedor.com)",
            phone: "El teléfono debe incluir un código de país (ejemplo: +1 305 555 0191)",
            preferred_language: "Selecciona tu idioma preferido",
            preferred_clinic: "Selecciona la clínica que deseas visitar",
            preferred_date: "Selecciona una fecha al menos 1 día hábil desde hoy y no más de 60 días adelante",
            preferred_time: "Selecciona tu horario preferido",
            service_type: "Selecciona el tipo de atención que necesitas",
            paediatric: "La atención pediátrica está disponible para pacientes menores de 18 años. Revisa la fecha de nacimiento o selecciona otro servicio.",
            new_patient: "Indica si esta es tu primera visita a HealthCore",
            has_insurance: "Indica si tienes seguro médico",
            insurance_provider: "Ingresa el nombre de tu proveedor de seguro",
            insurance_member_id: "El ID de miembro debe tener entre 6 y 20 caracteres alfanuméricos",
            patient_id: "El ID de paciente debe comenzar con HC- seguido de 6 letras o números",
            healthConcern: (remaining) => `Describe tu motivo de salud en al menos 20 caracteres (faltan ${remaining} caracteres)`,
            contact_consent: "Debes autorizar que te contacten antes de enviar este formulario",
            counter: (count) => `${count}/500 caracteres`,
            eveningWarning: (clinic, closes) => `Las citas nocturnas pueden ser limitadas en ${clinic} porque esta clínica cierra a las ${closes}. Recepción confirmará la disponibilidad.`,
            success: [
                "Gracias por comunicarte con HealthCore.",
                "Hemos recibido tu consulta. Una persona de nuestro equipo de recepción te contactará en 1 día hábil para confirmar los detalles de tu cita y responder cualquier pregunta.",
                "Si necesitas asistencia urgente, llama directamente a tu clínica preferida usando los números que aparecen en nuestro sitio web.",
                "Esperamos poder atenderte."
            ]
        }
    };

    const text = messages[locale];
    const inputErrorClasses = ["border-red-600", "focus:border-red-700", "focus:ring-red-700/30"];
    const inputSuccessClasses = ["border-emerald-600", "focus:border-emerald-700", "focus:ring-emerald-700/30"];
    const namePattern = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]{2,50}$/;
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    const phonePattern = /^\+\d{1,3}(?:[\s.-]?\d){6,14}$/;
    const memberPattern = /^[A-Za-z0-9]{6,20}$/;
    const patientIdPattern = /^HC-[A-Za-z0-9]{6}$/;

    const clinicHours = {
        "HealthCore Austin Central": { closeHour: 20, closesEn: "8pm", closesEs: "8pm" },
        "HealthCore Austin North": { closeHour: 19, closesEn: "7pm", closesEs: "7pm" },
        "HealthCore San Antonio": { closeHour: 18, closesEn: "6pm", closesEs: "6pm" },
        "HealthCore Miami": { closeHour: 20, closesEn: "8pm", closesEs: "8pm" },
        "HealthCore Orlando": { closeHour: 18, closesEn: "6pm", closesEs: "6pm" },
        "HealthCore Atlanta": { closeHour: 19, closesEn: "7pm", closesEs: "7pm" }
    };

    const fieldNames = [
        "first_name",
        "last_name",
        "date_of_birth",
        "email",
        "phone",
        "preferred_language",
        "preferred_clinic",
        "preferred_date",
        "preferred_time",
        "service_type",
        "insurance_provider",
        "insurance_member_id",
        "patient_id",
        "health_concern",
        "contact_consent"
    ];

    const byId = (id) => document.getElementById(id);
    const valueOf = (id) => (byId(id)?.value || "").trim();
    const selectedRadioValue = (name) => form.querySelector(`input[name="${name}"]:checked`)?.value || "";
    const hasInsurance = () => selectedRadioValue("has_insurance") === "Yes";
    const isReturningPatient = () => selectedRadioValue("new_patient") === "No";

    const parseDate = (value) => {
        if (!value) {
            return null;
        }

        const [year, month, day] = value.split("-").map(Number);

        if (!year || !month || !day) {
            return null;
        }

        const date = new Date(year, month - 1, day);
        const isSameDate =
            date.getFullYear() === year &&
            date.getMonth() === month - 1 &&
            date.getDate() === day;

        return isSameDate ? date : null;
    };

    const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

    const formatDateInput = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    };

    const addDays = (date, days) => {
        const copy = new Date(date);
        copy.setDate(copy.getDate() + days);
        return copy;
    };

    const addBusinessDays = (date, days) => {
        const copy = startOfDay(date);
        let added = 0;

        while (added < days) {
            copy.setDate(copy.getDate() + 1);
            const day = copy.getDay();

            if (day !== 0 && day !== 6) {
                added += 1;
            }
        }

        return copy;
    };

    const calculateAge = (birthDate) => {
        const today = startOfDay(new Date());
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDifference = today.getMonth() - birthDate.getMonth();

        if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
            age -= 1;
        }

        return age;
    };

    const getControls = (name) => {
        if (name === "new_patient" || name === "has_insurance") {
            return Array.from(form.querySelectorAll(`input[name="${name}"]`));
        }

        const control = byId(name);
        return control ? [control] : [];
    };

    const getError = (name) => byId(`${name}-error`);

    const resetControlVisual = (control) => {
        control.classList.remove(...inputErrorClasses, ...inputSuccessClasses);
        control.removeAttribute("aria-invalid");
    };

    const markControlInvalid = (control) => {
        control.classList.remove(...inputSuccessClasses);
        control.classList.add(...inputErrorClasses);
        control.setAttribute("aria-invalid", "true");
    };

    const markControlValid = (control) => {
        control.classList.remove(...inputErrorClasses);
        control.classList.add(...inputSuccessClasses);
        control.setAttribute("aria-invalid", "false");
    };

    const showError = (name, message) => {
        const error = getError(name);

        if (error) {
            error.textContent = message;
            error.classList.remove("hidden");
        }

        getControls(name).forEach(markControlInvalid);
        return false;
    };

    const clearError = (name, showSuccess = true) => {
        const error = getError(name);

        if (error) {
            error.textContent = "";
            error.classList.add("hidden");
        }

        getControls(name).forEach((control) => {
            resetControlVisual(control);

            if (showSuccess) {
                markControlValid(control);
            }
        });

        return true;
    };

    const clearFieldState = (name) => {
        const error = getError(name);

        if (error) {
            error.textContent = "";
            error.classList.add("hidden");
        }

        getControls(name).forEach(resetControlVisual);
    };

    const updateDateLimits = () => {
        const today = startOfDay(new Date());
        const minimumBirthDate = new Date(today.getFullYear() - 120, today.getMonth(), today.getDate());
        const minimumPreferredDate = addBusinessDays(today, 1);
        const maximumPreferredDate = addDays(today, 60);

        byId("date_of_birth").max = formatDateInput(today);
        byId("date_of_birth").min = formatDateInput(minimumBirthDate);
        byId("preferred_date").min = formatDateInput(minimumPreferredDate);
        byId("preferred_date").max = formatDateInput(maximumPreferredDate);
    };

    const validateFirstName = () => {
        const value = valueOf("first_name");
        return namePattern.test(value) ? clearError("first_name") : showError("first_name", text.first_name);
    };

    const validateLastName = () => {
        const value = valueOf("last_name");
        return namePattern.test(value) ? clearError("last_name") : showError("last_name", text.last_name);
    };

    const validateBirthDate = () => {
        const birthDate = parseDate(valueOf("date_of_birth"));
        const today = startOfDay(new Date());

        if (!birthDate || birthDate > today) {
            return showError("date_of_birth", text.date_of_birth);
        }

        const age = calculateAge(birthDate);

        if (age < 0 || age > 120) {
            return showError("date_of_birth", text.date_of_birth);
        }

        clearError("date_of_birth");

        if (valueOf("service_type") === "Paediatric Care") {
            validateServiceType();
        }

        return true;
    };

    const validateEmail = () => {
        const value = valueOf("email");
        return emailPattern.test(value) ? clearError("email") : showError("email", text.email);
    };

    const validatePhone = () => {
        const value = valueOf("phone");
        return phonePattern.test(value) ? clearError("phone") : showError("phone", text.phone);
    };

    const validateSelect = (name) => {
        const value = valueOf(name);
        return value ? clearError(name) : showError(name, text[name]);
    };

    const validatePreferredDate = () => {
        const preferredDate = parseDate(valueOf("preferred_date"));
        const today = startOfDay(new Date());
        const minimumDate = addBusinessDays(today, 1);
        const maximumDate = addDays(today, 60);

        if (!preferredDate || preferredDate < minimumDate || preferredDate > maximumDate) {
            return showError("preferred_date", text.preferred_date);
        }

        return clearError("preferred_date");
    };

    const validateServiceType = () => {
        const service = valueOf("service_type");

        if (!service) {
            return showError("service_type", text.service_type);
        }

        const birthDate = parseDate(valueOf("date_of_birth"));

        if (service === "Paediatric Care") {
            if (!birthDate || calculateAge(birthDate) >= 18) {
                return showError("service_type", text.paediatric);
            }
        }

        return clearError("service_type");
    };

    const validateRadioGroup = (name) => {
        return selectedRadioValue(name) ? clearError(name, false) : showError(name, text[name]);
    };

    const validateInsuranceProvider = () => {
        if (!hasInsurance()) {
            return clearError("insurance_provider", false);
        }

        const value = valueOf("insurance_provider");
        return value.length > 0 && value.length <= 100
            ? clearError("insurance_provider")
            : showError("insurance_provider", text.insurance_provider);
    };

    const validateInsuranceMemberId = () => {
        if (!hasInsurance()) {
            return clearError("insurance_member_id", false);
        }

        const value = valueOf("insurance_member_id");
        return memberPattern.test(value)
            ? clearError("insurance_member_id")
            : showError("insurance_member_id", text.insurance_member_id);
    };

    const validatePatientId = () => {
        if (!isReturningPatient()) {
            return clearError("patient_id", false);
        }

        const value = valueOf("patient_id");

        if (!value) {
            return clearError("patient_id", false);
        }

        return patientIdPattern.test(value)
            ? clearError("patient_id")
            : showError("patient_id", text.patient_id);
    };

    const updateConcernCounter = () => {
        const count = byId("health_concern").value.length;
        byId("health_concern-count").textContent = text.counter(count);
    };

    const validateHealthConcern = () => {
        const value = valueOf("health_concern");
        const remaining = Math.max(20 - value.length, 0);
        updateConcernCounter();

        if (value.length < 20 || value.length > 500) {
            return showError("health_concern", text.healthConcern(remaining));
        }

        return clearError("health_concern");
    };

    const validateConsent = () => {
        return byId("contact_consent").checked
            ? clearError("contact_consent", false)
            : showError("contact_consent", text.contact_consent);
    };

    const updateInsuranceVisibility = () => {
        const container = byId("insurance-fields");
        const provider = byId("insurance_provider");
        const memberId = byId("insurance_member_id");

        if (hasInsurance()) {
            container.classList.remove("hidden");
            container.classList.add("grid");
            provider.required = true;
            memberId.required = true;
            return;
        }

        container.classList.add("hidden");
        container.classList.remove("grid");
        provider.required = false;
        memberId.required = false;
        provider.value = "";
        memberId.value = "";
        clearFieldState("insurance_provider");
        clearFieldState("insurance_member_id");
    };

    const updatePatientIdVisibility = () => {
        const container = byId("patient-id-field");
        const patientId = byId("patient_id");

        if (isReturningPatient()) {
            container.classList.remove("hidden");
            return;
        }

        container.classList.add("hidden");
        patientId.value = "";
        clearFieldState("patient_id");
    };

    const updateClinicWarning = () => {
        const warning = byId("clinic-warning");
        const clinic = valueOf("preferred_clinic");
        const time = valueOf("preferred_time");
        const hours = clinicHours[clinic];

        if (time === "Evening" && hours && hours.closeHour < 20) {
            warning.textContent = text.eveningWarning(clinic, isSpanish ? hours.closesEs : hours.closesEn);
            warning.classList.remove("hidden");
            return;
        }

        warning.textContent = "";
        warning.classList.add("hidden");
    };

    const validateField = (name) => {
        switch (name) {
            case "first_name":
                return validateFirstName();
            case "last_name":
                return validateLastName();
            case "date_of_birth":
                return validateBirthDate();
            case "email":
                return validateEmail();
            case "phone":
                return validatePhone();
            case "preferred_language":
            case "preferred_clinic":
            case "preferred_time":
                updateClinicWarning();
                return validateSelect(name);
            case "preferred_date":
                return validatePreferredDate();
            case "service_type":
                return validateServiceType();
            case "insurance_provider":
                return validateInsuranceProvider();
            case "insurance_member_id":
                return validateInsuranceMemberId();
            case "patient_id":
                return validatePatientId();
            case "health_concern":
                return validateHealthConcern();
            case "contact_consent":
                return validateConsent();
            default:
                return true;
        }
    };

    const validateForm = () => {
        updateInsuranceVisibility();
        updatePatientIdVisibility();
        updateClinicWarning();

        const results = [
            validateFirstName(),
            validateLastName(),
            validateBirthDate(),
            validateEmail(),
            validatePhone(),
            validateSelect("preferred_language"),
            validateSelect("preferred_clinic"),
            validatePreferredDate(),
            validateSelect("preferred_time"),
            validateServiceType(),
            validateRadioGroup("new_patient"),
            validateRadioGroup("has_insurance"),
            validateInsuranceProvider(),
            validateInsuranceMemberId(),
            validatePatientId(),
            validateHealthConcern(),
            validateConsent()
        ];

        return results.every(Boolean);
    };

    const showSuccessMessage = () => {
        const success = byId("success-message");
        success.innerHTML = text.success.map((paragraph) => `<p class="mb-3 last:mb-0">${paragraph}</p>`).join("");
        success.classList.remove("hidden");
        success.focus();
        success.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    const hideSuccessMessage = () => {
        const success = byId("success-message");
        success.innerHTML = "";
        success.classList.add("hidden");
    };

    const focusFirstInvalidField = () => {
        const firstInvalid = form.querySelector('[aria-invalid="true"]');

        if (firstInvalid) {
            firstInvalid.focus();
        }
    };

    const resetFormState = () => {
        fieldNames.forEach(clearFieldState);
        clearFieldState("new_patient");
        clearFieldState("has_insurance");
        updateInsuranceVisibility();
        updatePatientIdVisibility();
        updateClinicWarning();
        updateConcernCounter();
        hideSuccessMessage();
    };

    let counterFrame = null;

    const queueConcernCounter = () => {
        if (counterFrame) {
            window.cancelAnimationFrame(counterFrame);
        }

        counterFrame = window.requestAnimationFrame(() => {
            updateConcernCounter();
            counterFrame = null;
        });
    };

    const setupListeners = () => {
        fieldNames.forEach((name) => {
            const control = byId(name);

            if (!control) {
                return;
            }

            const validateOnChange =
                control.tagName === "SELECT" ||
                control.type === "checkbox" ||
                control.type === "date";
            const validationEvent = validateOnChange ? "change" : "blur";

            control.addEventListener(validationEvent, () => {
                hideSuccessMessage();
                validateField(name);
            });

            if (!validateOnChange) {
                control.addEventListener("input", hideSuccessMessage);
            }

            if (name === "health_concern") {
                control.addEventListener("input", queueConcernCounter);
            }
        });

        form.querySelectorAll('input[name="new_patient"]').forEach((radio) => {
            radio.addEventListener("change", () => {
                hideSuccessMessage();
                updatePatientIdVisibility();
                validateRadioGroup("new_patient");
                validatePatientId();
            });
        });

        form.querySelectorAll('input[name="has_insurance"]').forEach((radio) => {
            radio.addEventListener("change", () => {
                hideSuccessMessage();
                updateInsuranceVisibility();
                validateRadioGroup("has_insurance");
                validateInsuranceProvider();
                validateInsuranceMemberId();
            });
        });

        byId("preferred_clinic").addEventListener("change", updateClinicWarning);
        byId("preferred_time").addEventListener("change", updateClinicWarning);
        byId("service_type").addEventListener("change", validateServiceType);
        byId("date_of_birth").addEventListener("change", validateServiceType);
    };

    updateDateLimits();
    updateConcernCounter();
    setupListeners();

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        hideSuccessMessage();

        if (validateForm()) {
            showSuccessMessage();
            return;
        }

        focusFirstInvalidField();
    });

    form.addEventListener("reset", () => {
        window.setTimeout(resetFormState, 0);
    });
};

const schedulePatientEnquiryForm = () => {
    if ("requestIdleCallback" in window) {
        window.requestIdleCallback(initPatientEnquiryForm, { timeout: 1000 });
        return;
    }

    window.setTimeout(initPatientEnquiryForm, 0);
};

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", schedulePatientEnquiryForm);
} else {
    schedulePatientEnquiryForm();
}
