"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import toast from "react-hot-toast";
import dayjs from "dayjs";
import {
	CenterClassroom,
	CenterClassSlot,
	ClassSlotPayload,
	createCenterClassSlot,
	overrideCenterClassSlotOccurrence,
	updateCenterClassSlot,
} from "@/services/centerService";
import { Course, getCoursesByCenter } from "@/services/courseService";
import { formatDateValue } from "@/utils/dateFormat";

interface Props {
	centerId: number;
	isOpen: boolean;
	onClose: () => void;
	onSuccess: () => void;
	slot?: CenterClassSlot | null;
	classrooms: CenterClassroom[];
	mode?: "series" | "occurrence";
	occurrenceDate?: string;
	occurrenceSlotId?: number;
	occurrenceStartTime?: string;
	occurrenceEndTime?: string;
	lockCourse?: boolean;
}

const WEEK_DAYS = [
	"MONDAY",
	"TUESDAY",
	"WEDNESDAY",
	"THURSDAY",
	"FRIDAY",
	"SATURDAY",
	"SUNDAY",
] as const;

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
	const totalHalfHoursFromMidnight = i;
	const hour24 = Math.floor(totalHalfHoursFromMidnight / 2);
	const minute = totalHalfHoursFromMidnight % 2 === 0 ? "00" : "30";
	const value = `${String(hour24).padStart(2, "0")}:${minute}`;
	const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
	const amPm = hour24 < 12 ? "AM" : "PM";
	const label = `${hour12}:${minute} ${amPm}`;
	return { value, label };
});

const normalizeTimeToHHmm = (time?: string) => {
	if (!time) return "";
	return time.slice(0, 5);
};

export default function ClassSlotModal({
	centerId,
	isOpen,
	onClose,
	onSuccess,
	slot,
	classrooms,
	mode = "series",
	occurrenceDate,
	occurrenceSlotId,
	occurrenceStartTime,
	occurrenceEndTime,
	lockCourse = false,
}: Props) {
	const [courses, setCourses] = useState<Course[]>([]);
	const [loading, setLoading] = useState(false);
	const [courseId, setCourseId] = useState<number | "">("");
	const [classroomId, setClassroomId] = useState<number | "">("");
	const [startTime, setStartTime] = useState("");
	const [endTime, setEndTime] = useState("");
	const [daysOfWeek, setDaysOfWeek] = useState<string[]>([]);
	const [recurring, setRecurring] = useState(true);
	const isOccurrenceMode = mode === "occurrence";
	const occurrenceDayLabel = occurrenceDate ? dayjs(occurrenceDate).format("dddd") : "";

	const startTimeOptions = TIME_OPTIONS.filter((time) => time.value < "23:30");
	const endTimeOptions = TIME_OPTIONS.filter((time) => (startTime ? time.value > startTime : true));

	const getErrorMessage = (error: any, fallback: string) => {
		const data = error?.response?.data;
		if (typeof data === "string" && data.trim()) return data;
		if (data?.error && typeof data.error === "string") return data.error;
		if (data?.message && typeof data.message === "string") return data.message;
		if (error?.message && typeof error.message === "string") return error.message;
		return fallback;
	};

	useEffect(() => {
		if (!isOpen) return;
		const fetchCourses = async () => {
			try {
				const data = await getCoursesByCenter(centerId);
				setCourses(data);
			} catch (error: any) {
				console.error(error);
				toast.error(getErrorMessage(error, "Cannot load courses."));
			}
		};
		fetchCourses();
	}, [isOpen, centerId]);

	useEffect(() => {
		if (!isOpen) return;

		if (slot) {
			setCourseId(slot.course?.id ?? "");
			setClassroomId(slot.classroom?.id ?? "");
			const initialStartTime = isOccurrenceMode
				? normalizeTimeToHHmm(occurrenceStartTime) || normalizeTimeToHHmm(slot.startTime)
				: normalizeTimeToHHmm(slot.startTime);
			const initialEndTime = isOccurrenceMode
				? normalizeTimeToHHmm(occurrenceEndTime) || normalizeTimeToHHmm(slot.endTime)
				: normalizeTimeToHHmm(slot.endTime);

			setStartTime(initialStartTime);
			setEndTime(initialEndTime);
			setDaysOfWeek(slot.daysOfWeek ?? []);
			setRecurring(Boolean(slot.isRecurring));
		} else {
			setCourseId("");
			setClassroomId("");
			setStartTime("");
			setEndTime("");
			setDaysOfWeek([]);
			setRecurring(true);
		}
	}, [isOpen, slot, isOccurrenceMode, occurrenceStartTime, occurrenceEndTime, occurrenceDate, occurrenceSlotId]);

	if (!isOpen) return null;

	const toggleDay = (day: string) => {
		setDaysOfWeek((prev) =>
			prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
		);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		const userRaw = localStorage.getItem("user");
		const user = userRaw ? JSON.parse(userRaw) : null;
		const managerId = user?.id;

		if (!managerId) {
			toast.error("Cannot identify manager. Please login again.");
			return;
		}

		if (!courseId) {
			toast.error("Please select a course.");
			return;
		}

		if (!classroomId) {
			toast.error("Please select a classroom.");
			return;
		}

		if (!startTime || !endTime) {
			toast.error("Please select start and end time.");
			return;
		}

		const isHalfHour = (time: string) => {
			const minutePart = Number(time.split(":")[1] ?? "-1");
			return minutePart === 0 || minutePart === 30;
		};

		if (!isHalfHour(startTime) || !isHalfHour(endTime)) {
			toast.error("Time must be on :00 or :30 only.");
			return;
		}

		if (endTime <= startTime) {
			toast.error("End time must be after start time.");
			return;
		}

		if (daysOfWeek.length === 0) {
			toast.error("Please select at least one day.");
			return;
		}

		try {
			setLoading(true);

			if (isOccurrenceMode) {
				const targetSlotId = occurrenceSlotId ?? slot?.id;
				if (!targetSlotId || !occurrenceDate) {
					toast.error("Missing selected occurrence information.");
					return;
				}

				await overrideCenterClassSlotOccurrence(centerId, targetSlotId, occurrenceDate, {
					managerId,
					startTime,
					endTime,
					classroomId: Number(classroomId),
				});
				toast.success("Selected occurrence updated.");
			} else {
				const payload: ClassSlotPayload = {
					managerId,
					courseId: Number(courseId),
					classroomId: Number(classroomId),
					startTime,
					endTime,
					daysOfWeek,
					recurring,
				};

				if (slot) {
					await updateCenterClassSlot(centerId, slot.id, payload);
					toast.success("Class slot updated.");
				} else {
					await createCenterClassSlot(centerId, payload);
					toast.success("Class slot created.");
				}
			}

			onSuccess();
			onClose();
		} catch (error: any) {
			toast.error(getErrorMessage(error, "Failed to save class slot."));
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="fixed inset-0 z-[2000] bg-black/40 backdrop-blur-sm flex items-center justify-center px-4">
			<div className="mt-15 bg-white w-full max-w-xl rounded-2xl shadow-2xl p-6 space-y-5">
				<div className="flex items-center justify-between border-b pb-3">
					<h3 className="text-lg font-bold text-[var(--color-text)]">
						{isOccurrenceMode ? "Edit Selected Occurrence" : slot ? "Edit Class Slot" : "Add Class Slot"}
					</h3>
					<button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition">
						<X size={20} />
					</button>
				</div>

				{isOccurrenceMode && occurrenceDate && (
					<div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-700">
						<div><span className="font-medium">Date:</span> {formatDateValue(occurrenceDate)}</div>
						<div><span className="font-medium">Day:</span> {occurrenceDayLabel}</div>
					</div>
				)}

				<form onSubmit={handleSubmit} className="space-y-4">
					<div>
						<label className="block text-sm font-medium text-[var(--color-text)] mb-1">Course <span className="text-[var(--color-negative)]">*</span></label>
						<select
							value={courseId}
							onChange={(e) => setCourseId(e.target.value ? Number(e.target.value) : "")}
							className={`w-full p-3 border-2 rounded-lg outline-none ${lockCourse || isOccurrenceMode
								? "border-gray-300 bg-gray-100 text-gray-500 cursor-not-allowed"
								: "border-[var(--color-main)] bg-white"
								}`}
							disabled={lockCourse || isOccurrenceMode}
							required
						>
							<option value="">Select course</option>
							{courses.map((course) => (
								<option key={course.id} value={course.id}>{course.name}</option>
							))}
						</select>
						{(lockCourse || isOccurrenceMode) && (
							<p className="mt-1 text-xs text-gray-500">Course is locked for selected occurrence editing.</p>
						)}
					</div>

					<div>
						<label className="block text-sm font-medium text-[var(--color-text)] mb-1">Classroom <span className="text-[var(--color-negative)]">*</span></label>
						<select
							value={classroomId}
							onChange={(e) => setClassroomId(e.target.value ? Number(e.target.value) : "")}
							className="w-full p-3 border-2 border-[var(--color-main)] rounded-lg outline-none bg-white"
							required
						>
							<option value="">Select classroom</option>
							{classrooms.map((room) => (
								<option key={room.id} value={room.id}>
									{room.location} (seat {room.seat})
								</option>
							))}
						</select>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div>
							<label className="block text-sm font-medium text-[var(--color-text)] mb-1">Start Time <span className="text-[var(--color-negative)]">*</span></label>
							<select
								value={startTime}
								onChange={(e) => setStartTime(e.target.value)}
								className="w-full p-3 border-2 border-[var(--color-main)] rounded-lg outline-none bg-white"
								required
							>
								<option value="">Select start time</option>
								{startTimeOptions.map((time) => (
									<option key={time.value} value={time.value}>
										{time.label}
									</option>
								))}
							</select>
						</div>
						<div>
							<label className="block text-sm font-medium text-[var(--color-text)] mb-1">End Time <span className="text-[var(--color-negative)]">*</span></label>
							<select
								value={endTime}
								onChange={(e) => setEndTime(e.target.value)}
								className="w-full p-3 border-2 border-[var(--color-main)] rounded-lg outline-none bg-white"
								required
							>
								<option value="">Select end time</option>
								{endTimeOptions.map((time) => (
									<option key={time.value} value={time.value}>
										{time.label}
									</option>
								))}
							</select>
						</div>
					</div>

					{!isOccurrenceMode && (
						<>
							<div>
								<label className="block text-sm font-medium text-[var(--color-text)] mb-2">Days of week</label>
								<div className="grid grid-cols-2 md:grid-cols-4 gap-2">
									{WEEK_DAYS.map((day) => (
										<label key={day} className="flex items-center gap-2 text-sm text-[var(--color-text)]">
											<input
												type="checkbox"
												checked={daysOfWeek.includes(day)}
												onChange={() => toggleDay(day)}
											/>
											{day.slice(0, 3)}
										</label>
									))}
								</div>
							</div>

							<label className="flex items-center gap-2 text-sm text-[var(--color-text)]">
								<input
									type="checkbox"
									checked={recurring}
									onChange={(e) => setRecurring(e.target.checked)}
								/>
								Recurring
							</label>
						</>
					)}

					<div className="flex justify-end gap-3 pt-4 border-t">
						<button
							type="button"
							onClick={onClose}
							className="px-4 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 transition"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={loading}
							className="bg-[var(--color-main)] border-2 border-[var(--color-main)] text-white px-4 py-2 rounded-lg font-bold hover:bg-[var(--color-soft-white)] hover:text-[var(--color-main)] transition disabled:opacity-50"
						>
							{loading ? "Saving..." : "Save"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
