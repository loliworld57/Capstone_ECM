"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowDownAZ, ArrowUpZA, Building2, Edit2Icon, LocateIcon, LocationEdit, MapPin, Plus, Search, Trash2, Users, Wrench } from "lucide-react";
import toast from "react-hot-toast";
import {
	CenterClassroom,
	deleteCenterClassroom,
	getCenterClassrooms,
} from "@/services/centerService";
import ClassroomModal from "./ClassroomModal";
import ConfirmModal from "@/components/ConfirmModal";
import { formatDateValue } from "@/utils/dateFormat";
import { useLockBodyScroll } from "@/hook/useLockBodyScroll";

interface Props {
	centerId: number;
	isManager: boolean;
}

export default function ClassroomTab({ centerId, isManager }: Props) {
	const rowsPerPage = 8;
	const [classrooms, setClassrooms] = useState<CenterClassroom[]>([]);
	const [loading, setLoading] = useState(true);
	const [isModalOpen, setModalOpen] = useState(false);
	const [editingClassroom, setEditingClassroom] = useState<CenterClassroom | null>(null);
	const [deletingClassroom, setDeletingClassroom] = useState<CenterClassroom | null>(null);
	const [searchTerm, setSearchTerm] = useState("");
	const [lastModifiedDateFilter, setLastModifiedDateFilter] = useState("");
	const [sortDirection, setSortDirection] = useState<"desc" | "asc">("desc");
	const [currentPage, setCurrentPage] = useState(1);

	const fetchClassrooms = useCallback(async () => {
		try {
			setLoading(true);
			const data = await getCenterClassrooms(centerId);
			setClassrooms(data);
		} catch (error) {
			console.error(error);
			toast.error("Cannot load classrooms.");
		} finally {
			setLoading(false);
		}
	}, [centerId]);

	useEffect(() => {
		fetchClassrooms();
	}, [fetchClassrooms]);

	const handleDelete = async (room: CenterClassroom) => {
		const userRaw = localStorage.getItem("user");
		const user = userRaw ? JSON.parse(userRaw) : null;
		const managerId = user?.id;

		if (!managerId) {
			toast.error("Cannot identify manager. Please login again.");
			return;
		}

		try {
			await deleteCenterClassroom(centerId, room.id, managerId);
			toast.success("Classroom deleted.");
			setDeletingClassroom(null);
			fetchClassrooms();
		} catch (error: any) {
			const responseData = error?.response?.data;
			const message =
				responseData?.error ||
				responseData?.message ||
				(typeof responseData === "string" ? responseData : null) ||
				"Could not delete classroom.";
			toast.error(message);
		}
	};

	const filteredClassrooms = useMemo(() => {
		const normalizedSearch = searchTerm.trim().toLowerCase();

		return classrooms
			.filter((room) => {
				const nameMatch = !normalizedSearch || room.location.toLowerCase().includes(normalizedSearch);
				const dateMatch = !lastModifiedDateFilter || room.lastMaintainDate === lastModifiedDateFilter;
				return nameMatch && dateMatch;
			})
			.sort((left, right) => {
				const leftTime = new Date(left.lastMaintainDate).getTime();
				const rightTime = new Date(right.lastMaintainDate).getTime();
				return sortDirection === "desc" ? rightTime - leftTime : leftTime - rightTime;
			});
	}, [classrooms, searchTerm, lastModifiedDateFilter, sortDirection]);

	useEffect(() => {
		setCurrentPage(1);
	}, [searchTerm, lastModifiedDateFilter, sortDirection, classrooms]);

	const totalPages = Math.max(1, Math.ceil(filteredClassrooms.length / rowsPerPage));

	useEffect(() => {
		if (currentPage > totalPages) {
			setCurrentPage(totalPages);
		}
	}, [currentPage, totalPages]);

	const paginatedClassrooms = useMemo(() => {
		const startIndex = (currentPage - 1) * rowsPerPage;
		return filteredClassrooms.slice(startIndex, startIndex + rowsPerPage);
	}, [filteredClassrooms, currentPage]);

	useLockBodyScroll(isModalOpen || !!deletingClassroom);

	if (loading) {
		return (
			<div className="p-12 text-center text-sm font-medium text-[var(--color-text)] opacity-70 animate-pulse">
				Loading facility inventory...
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<ConfirmModal
				isOpen={!!deletingClassroom}
				title="Delete Classroom"
				message={`Are you sure you want to permanently delete the classroom at "${deletingClassroom?.location || ""}"? This action cannot be undone.`}
				confirmText="Delete"
				onClose={() => setDeletingClassroom(null)}
				onConfirm={() => (deletingClassroom ? handleDelete(deletingClassroom) : undefined)}
			/>

			<ClassroomModal
				centerId={centerId}
				isOpen={isModalOpen}
				onClose={() => setModalOpen(false)}
				onSuccess={fetchClassrooms}
				classroom={editingClassroom}
			/>

			{/* UPGRADED HEADER STYLE BLOCK */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-gradient-to-r from-gray-50 to-transparent p-4 rounded-xl border border-gray-100">
				<div className="space-y-1.5">
					<div className="flex items-center gap-2.5">
						<div className="p-2 rounded-lg bg-[var(--color-secondary)]/10 text-[var(--color-main)]">
							<Building2 size={20} className="stroke-[2.2]" />
						</div>
						<div>
							<h3 className="font-extrabold text-lg text-[var(--color-text)] tracking-tight">
								Classrooms Hub
							</h3>
							<p className="text-xs text-gray-500 font-medium">
								Monitor physical space allocations, capacities, and maintenance schedules ({filteredClassrooms.length} tracked)
							</p>
						</div>
					</div>
				</div>

				{isManager && (
					<button
						onClick={() => {
							setEditingClassroom(null);
							setModalOpen(true);
						}}
						className="flex items-center justify-center gap-2 border border-transparent bg-[var(--color-main)] hover:opacity-95 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-all outline-none shadow-xs shrink-0 self-start sm:self-auto"
					>
						<Plus size={16} className="stroke-[2.5]" /> Add Classroom
					</button>
				)}
			</div>

			{/* FILTER MODIFIER BAR CONTAINER */}
			<div className="grid grid-cols-1 gap-3 rounded-xl border border-gray-200/60 bg-gray-50/60 p-2 md:grid-cols-4">
				<div className="relative md:col-span-2">
					<Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
					<input
						value={searchTerm}
						onChange={(event) => setSearchTerm(event.target.value)}
						placeholder="Search by location name..."
						className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-[var(--color-text)] outline-none transition placeholder-gray-400 focus:border-[var(--color-main)] focus:ring-2 focus:ring-[var(--color-main)]/10"
					/>
				</div>

				<input
					type="date"
					value={lastModifiedDateFilter}
					onChange={(event) => setLastModifiedDateFilter(event.target.value)}
					className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-[var(--color-text)] outline-none transition focus:border-[var(--color-main)] focus:ring-2 focus:ring-[var(--color-main)]/10"
					title="Filter by last modified date"
				/>

				<button
					type="button"
					onClick={() => setSortDirection((value) => (value === "desc" ? "asc" : "desc"))}
					className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 hover:text-gray-800 active:scale-[0.98]"
				>
					{sortDirection === "desc" ? <ArrowDownAZ size={16} className="text-gray-400" /> : <ArrowUpZA size={16} className="text-gray-400" />}
					{sortDirection === "desc" ? "Newest First" : "Oldest First"}
				</button>
			</div>

			{/* MAIN INTERACTIVE LIST MATRIX */}
			{classrooms.length === 0 ? (
				<div className="p-12 text-center text-gray-400 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
					<Building2 size={32} className="mx-auto text-gray-300 mb-3" />
					<p className="text-sm font-medium">No classrooms recorded for this location yet.</p>
				</div>
			) : filteredClassrooms.length === 0 ? (
				<div className="p-12 text-center text-gray-400 bg-white rounded-xl border border-gray-200 shadow-xs">
					No building layouts match your targeted filter criteria.
				</div>
			) : (
				<>
					<div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs">
						<div className="overflow-x-auto">
							<table className="w-full text-left text-sm border-collapse">
								{/* CLEAN TEXT TABLE HEAD */}
								<thead className="bg-[var(--color-main)] border-b border-gray-200 text-white uppercase font-bold tracking-wider">
									<tr>
										<th className="px-6 py-3.5">Classroom Location / Name</th>
										<th className="px-6 py-3.5">Seat Capacity</th>
										<th className="px-6 py-3.5">Last Maintained Date</th>
										{isManager && <th className="px-6 py-3.5 text-right">Actions</th>}
									</tr>
								</thead>

								<tbody className="divide-y divide-gray-100 text-gray-700">
									{paginatedClassrooms.map((room) => (
										<tr key={room.id} className="transition-colors duration-150 hover:bg-gray-50/40 group">
											<td className="px-6 py-4 whitespace-nowrap font-semibold text-[var(--color-text)] text-xs">
												<div className="flex items-center gap-2.5">
													<div className="p-1.5 rounded bg-gray-100 text-gray-400 group-hover:bg-white group-hover:text-[var(--color-main)] border border-transparent group-hover:border-gray-200 transition-all">
														<MapPin size={14} />
													</div>
													{room.location}
												</div>
											</td>

											<td className="px-6 py-4 whitespace-nowrap text-xs">
												<span className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-secondary)]/30 bg-[var(--color-secondary)]/10 px-2.5 py-1 text-xs font-bold text-[var(--color-main)] tracking-wide">
													<Users size={13} className="text-gray-400" />
													{room.seat} seats
												</span>
											</td>

											<td className="px-6 py-4 whitespace-nowrap text-xs font-medium text-gray-500">
												<div className="flex items-center gap-1.5">
													<Wrench size={13} className="text-gray-400" />
													{formatDateValue(room.lastMaintainDate)}
												</div>
											</td>

											{isManager && (
												<td className="px-6 py-4 whitespace-nowrap text-right text-xs">
													<div className="flex justify-end items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
														<button
															onClick={() => {
																setEditingClassroom(room);
																setModalOpen(true);
															}}
															className="p-1.5 border border-gray-200 bg-white text-gray-500 rounded-md hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 transition-all outline-none"
															title="Modify Room Setup"
														>
															<Edit2Icon size={20} className="stroke-[2.5]" />
														</button>

														<button
															onClick={() => setDeletingClassroom(room)}
															className="p-1.5 border border-gray-200 bg-white text-gray-400 rounded-md hover:text-[var(--color-alert)] hover:bg-red-50 hover:border-red-200 transition-all outline-none"
															title="Delete Room Entry"
														>
															<Trash2 size={20} className="stroke-[2.5]" />
														</button>
													</div>
												</td>
											)}
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>

					{/* PAGINATION INTERFACE COMPONENT */}
					{filteredClassrooms.length > rowsPerPage && (
						<div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-gray-50/50 p-4 md:flex-row md:items-center md:justify-between">
							<p className="text-xs font-medium text-gray-500">
								Showing <span className="font-bold text-gray-700">{(currentPage - 1) * rowsPerPage + 1}</span> to{" "}
								<span className="font-bold text-gray-700">{Math.min(currentPage * rowsPerPage, filteredClassrooms.length)}</span> of{" "}
								<span className="font-bold text-gray-700">{filteredClassrooms.length}</span> rooms
							</p>

							<div className="flex items-center gap-2.5">
								<button
									onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
									disabled={currentPage === 1}
									className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white"
								>
									Previous
								</button>

								<span className="text-xs font-bold text-gray-600 min-w-[80px] text-center">
									Page {currentPage} of {totalPages}
								</span>

								<button
									onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
									disabled={currentPage === totalPages}
									className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white"
								>
									Next
								</button>
							</div>
						</div>
					)}
				</>
			)}
		</div>
	);
}