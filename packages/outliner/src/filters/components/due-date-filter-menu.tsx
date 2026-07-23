import { Menu } from "@base-ui/react";
import { CalendarRange } from "@cascade/ui/calendar-range";
import {
	CalendarDotIcon,
	CalendarDotsIcon,
	CalendarIcon,
	CaretRightIcon,
	CheckIcon,
} from "@phosphor-icons/react/ssr";
import {
	type OutlinerLabels,
	useOutlinerLabels,
} from "../../i18n/outliner-labels-context";
import type { NodeFilters } from "../model/node-filters";
import { calendarPopup, groupLabel, menuItem } from "./filters-bar.styles";

interface DueDateFilterMenuProps {
	filters: NodeFilters;
	onFiltersChange: (filters: NodeFilters) => void;
	onCompleteSelection: () => void;
}

export function DueDateFilterMenu({
	filters,
	onFiltersChange,
	onCompleteSelection,
}: DueDateFilterMenuProps) {
	const labels = useOutlinerLabels();
	const relativeFilters = getRelativeFilterOptions(labels);

	const clearDueDateSelection = {
		dueToday: false,
		dueThisWeek: false,
		dueOnDate: null,
		dueDateRange: null,
	} as const;

	return (
		<Menu.Group>
			<Menu.GroupLabel className={groupLabel()}>
				{labels.filtersDueDateGroup}
			</Menu.GroupLabel>
			{relativeFilters.map((filter) => (
				<Menu.CheckboxItem
					key={filter.key}
					className={menuItem()}
					checked={filters[filter.key]}
					closeOnClick
					onCheckedChange={(checked) =>
						onFiltersChange({
							...filters,
							...clearDueDateSelection,
							[filter.key]: checked,
						})
					}
				>
					<filter.icon size={13} weight="bold" />
					{filter.label}
					<Menu.CheckboxItemIndicator className="ml-auto">
						<CheckIcon size={13} weight="bold" />
					</Menu.CheckboxItemIndicator>
				</Menu.CheckboxItem>
			))}
			<Menu.SubmenuRoot>
				<Menu.SubmenuTrigger className={menuItem()}>
					<CalendarIcon size={13} weight="bold" />
					{labels.filtersDueOnDate}
					<CaretRightIcon size={13} weight="bold" className="ml-auto" />
				</Menu.SubmenuTrigger>
				<Menu.Portal>
					<Menu.Positioner className="z-50 outline-none" sideOffset={6}>
						<Menu.Popup className={calendarPopup()}>
							<CalendarRange
								singleValue={filters.dueOnDate}
								value={filters.dueDateRange}
								onSelectSingle={(date) =>
									onFiltersChange({
										...filters,
										...clearDueDateSelection,
										dueOnDate: date,
									})
								}
								onSelect={(range) => {
									onFiltersChange({
										...filters,
										...clearDueDateSelection,
										dueDateRange: range,
									});
									onCompleteSelection();
								}}
								onClear={() =>
									onFiltersChange({
										...filters,
										dueOnDate: null,
										dueDateRange: null,
									})
								}
							/>
						</Menu.Popup>
					</Menu.Positioner>
				</Menu.Portal>
			</Menu.SubmenuRoot>
		</Menu.Group>
	);
}

export function getRelativeFilterOptions(labels: OutlinerLabels) {
	return [
		{
			key: "dueToday",
			label: labels.filtersDueToday,
			removeLabel: labels.filtersRemoveDueToday,
			icon: CalendarDotIcon,
		},
		{
			key: "dueThisWeek",
			label: labels.filtersDueThisWeek,
			removeLabel: labels.filtersRemoveDueThisWeek,
			icon: CalendarDotsIcon,
		},
	] as const;
}
