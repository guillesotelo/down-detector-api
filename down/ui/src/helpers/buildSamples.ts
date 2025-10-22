import { Build, ModuleInfo } from "../types";

const buildNames = [
    "Nightly Build",
    "Merge Build",
    "Development Build",
    "Production Build",
    "Staging Build",
    "Hotfix Build",
    "Canary Build",
    "Release Candidate",
    "Alpha Build",
    "Beta Build",
    "QA Build",
    "Integration Build",
    "Smoke Test Build",
    "Performance Build",
    "Sandbox Build",
    "Test Flight Build",
    "Debug Build",
    "Patch Build",
    "Rollback Build",
    "Experimental Build"
];
const fruits = ["banana", "apple", "orange", "kiwi", "grape", "mango", "pear", "peach"];
const branches = ["master", "spa2", "spa2_release_1", "p519_fcr", "p519", "p519_release"];
const moduleNames = [
    "rain_detector_front", "rain_detector_back", "tire_pressure_monitor", "engine_temp_monitor",
    "battery_voltage_monitor", "fuel_injector_control", "brake_pressure_monitor", "lane_departure_warning",
    "collision_avoidance_unit", "adaptive_cruise_module", "steering_angle_monitor", "gps_position_tracker",
    "accelerometer_unit", "gyroscope_unit", "parking_assist_module", "blind_spot_warning_unit",
    "camera_front", "camera_rear", "camera_left", "camera_right", "airbag_deployment_unit",
    "abs_controller", "traction_control_unit", "oxygen_monitor", "exhaust_temp_module",
    "speedometer_reader", "dashboard_interface", "infotainment_module", "door_lock_monitor", "headlight_control_unit",
    "ambient_light_detector", "pedal_position_monitor", "driver_fatigue_detector", "ecu_main_processor",
    "gearbox_control_module", "engine_control_unit", "coolant_level_monitor", "windshield_wiper_controller",
    "cabin_temp_controller", "humidity_monitor", "sunroof_position_tracker", "seatbelt_status_monitor",
    "rearview_camera_unit", "battery_health_checker", "engine_vibration_analyzer", "valve_position_monitor",
    "turbo_boost_monitor", "lane_change_assist_unit", "night_vision_module", "traffic_sign_reader",
    "voice_control_module", "keyless_entry_receiver", "wireless_charging_controller", "driving_mode_selector",
    "hill_start_assist", "auto_parking_unit", "fog_light_controller", "child_lock_tracker",
    "power_steering_unit", "road_surface_analyzer", "adaptive_light_unit", "air_filter_monitor",
    "cabin_air_quality_module", "window_position_tracker", "interior_motion_detector", "trunk_latch_monitor",
    "oil_pressure_gauge", "spark_timing_unit", "fuel_pump_monitor", "rear_axle_monitor",
    "differential_temp_monitor", "battery_current_reader", "ignition_control_module", "drive_shaft_monitor",
    "egr_valve_monitor", "knock_detection_unit", "cooling_fan_controller", "intake_air_temp_module",
    "manifold_pressure_reader", "throttle_position_unit", "starter_motor_checker", "crankshaft_position_tracker",
    "camshaft_position_module", "gear_position_indicator", "eco_mode_controller", "drive_mode_switch",
    "rear_defrost_unit", "trailer_connection_checker", "brake_fluid_level_monitor", "towing_assist_module",
    "auto_high_beam_controller", "ambient_noise_analyzer", "vehicle_speed_reader", "engine_oil_level_gauge",
    "head_restraint_detector", "door_open_tracker", "inertia_switch_unit", "load_detection_module",
    "cabin_light_module", "mirror_angle_tracker", "defogger_controller", "lane_marker_tracker"
];

function getRandomDate(base = new Date(), offsetDays = 0): string {
    const d = new Date(base);
    const hours = Math.floor(Math.random() * 24)
    const minutes = Math.floor(Math.random() * 60)
    d.setDate(d.getDate() - Math.floor(Math.random() * offsetDays))
    d.setMinutes(minutes)
    d.setHours(hours)
    return d.toISOString()
}

function getRandomElement<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
}

function generateVersion(): string {
    return `${Math.floor(Math.random() * 5 + 1)}.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 10)}`;
}

export const generateBuildSamples = (buildCount: number = 20, modulesPerBuild: number = 100): Build[] => {
    const builds: Build[] = [];

    for (let i = 0; i < buildCount; i++) {
        const modules: Record<string, ModuleInfo> = {};
        const usedModules = new Set<string>();
        let j = 0

        while (Object.keys(modules).length < modulesPerBuild) {
            const moduleName = getRandomElement(moduleNames);
            // if (usedModules.has(moduleName)) continue; // use this if there are 100 or more moduleNames 
            usedModules.add(moduleName);

            modules[moduleName] = {
                status: (j % 7 === 0 && i % 7 === 0) ? 'failure' : 'success',
                date: getRandomDate(new Date("2025-03-23"), 10),
                org: {
                    art: getRandomElement(["ARTCSAS", "ARTBFS", "ARTXYZ", "ARTDEF"]),
                    solution: getRandomElement(["SWEP"])
                },
                version: generateVersion()
            };
            j++
        }

        builds.push({
            name: buildNames[i],
            classifier: getRandomElement(fruits),
            date: getRandomDate(new Date("2025-03-23"), 10),
            target_branch: getRandomElement(branches),
            modules
        })
    }

    return builds;
}